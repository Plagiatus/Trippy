import validationUtils from "../../utils/validation-utils";
import RouteMaker from "../route";
import SessionsCollection from "../../session/sessions-collection";
import Session from "../../session/session";
import DiscordClient from "../../bot/discord-client";
import utils from "../../utils/utils";
import DatabaseClient from "../../database-client";
import RecommendationHelper from "../../recommendation-helper";
import registerCommand from "../../bot/interactions/commands/register-command";

export default (({server, responses, provider, isAuthenticatedGuard}) => { 
    const sessionsCollection = provider.get(SessionsCollection);
    const databaseClient = provider.get(DatabaseClient);
    const discordClient = provider.get(DiscordClient);
    const recommendationHelper = provider.get(RecommendationHelper);

    server.route("/session/millisecondsTillPing")
        .get(isAuthenticatedGuard, async (req, res) => {
            const userData = await databaseClient.userRepository.get(req.userId!);
			const millisecondsTillNextPing = recommendationHelper.getMillisecondsTillNextAllowedPing(userData);

			res.send({millisecondsTillNextPing});
        })
        .all(responses.wrongMethod);

    server.route("/session/:id?")
        .get(isAuthenticatedGuard, async (req, res) => {
            if (req.params.id) {
                const rawSession = await databaseClient.sessionRepository.get(req.params.id);
                if (!rawSession || rawSession.hostId !== req.userId) {
                    return responses.sendCustomError(`Unable to get session with id "${req.params.id}".`, res);
                }
                const session = sessionsCollection.getSession(rawSession.id);
                const usersInSession = await utils.asyncMap(session?.joinedUserIds ?? [], id => discordClient.getMember(id));

                return res.send({
                    state: rawSession.state,
                    blueprint: rawSession.blueprint,
                    id: rawSession.id,
                    users: usersInSession.filter(utils.getHasValuePredicate()).map(user => ({
                        id: user.id,
                        name: user.displayName,
                        avatar: user.user.displayAvatarURL({size: 256}),
                    }))
                })
            }

            const sessions: Session[] = []
            const session = sessionsCollection.getHostedSession(req.userId!) ?? sessionsCollection.getJoinedSession(req.userId!);
            if (session) {
                sessions.push(session);
            }

            return res.send({
                sessions: sessions.map(session => ({
                    uniqueId: session.uniqueId,
                    id: session.id,
                    isHosting: session.hostId === req.userId,
                    name: session.blueprint.name,
                    imageId: session.blueprint.imageId,
                }))
            });
        })
        .post(isAuthenticatedGuard, async (req, res) => {
            const noneValidatedBlueprint = typeof req.body === "object" && "blueprint" in req.body ? JSON.parse(req.body.blueprint) : null;
            const forExperienceId = typeof req.body === "object" && "experienceId" in req.body && typeof req.body.experienceId === "string" ? req.body.experienceId + "" : "";
            const removeImage = typeof req.body === "object" && "removeImage" in req.body;
            const imageFile = Array.isArray(req.files) ? req.files.find(file => file.fieldname === "image") : undefined;

            const { validationResult, validatedValue } = validationUtils.valdiateSessionBlueprint(noneValidatedBlueprint);
            if (!validatedValue) {
                return responses.sendCustomError("Failed to validate blueprint: " + validationResult.errors.map(error => `"${error.property}": ${error.message}`).join(". "), res);
            }

            const userInformation = await databaseClient.userRepository.get(req.userId!);
            if (validatedValue.server.type === "realms" && !validatedValue.server.owner) {
                if (validatedValue.edition === "java" && !userInformation.javaAccount) {
                    return responses.sendCustomError(`You don't have a Java username set. Please use the /${registerCommand.name} command to set your username.`, res);
                }
                if (validatedValue.edition === "bedrock" && !userInformation.bedrockAccount) {
                    return responses.sendCustomError(`You don't have a Bedrock username set. Please use the /${registerCommand.name} command to set your username.`, res);
                }
            }

            if (recommendationHelper.canUseImages(userInformation)) {
                if (imageFile) {
                    validationUtils.validateSessionImage(imageFile);
                    const imageId = await databaseClient.imageRepository.addImage(imageFile);
                    validatedValue.imageId = imageId;
                } else if (removeImage) {
                    validatedValue.imageId = undefined;
                } else if (validatedValue.imageId !== undefined && !await databaseClient.imageRepository.exists(validatedValue.imageId)) {
                    validatedValue.imageId = undefined;
                }
            } else {
                validatedValue.imageId = undefined;
            }

            if (recommendationHelper.getMillisecondsTillNextAllowedPing(userInformation) ?? 1 > 0) {
                validatedValue.ping = false;
            }

            if (req.params.id) {
                const session = sessionsCollection.getSession(req.params.id);
                if (!session || session.hostId !== req.userId || session.state !== "running") {
                    return responses.sendCustomError(`Unable to change session with id "${req.params.id}".`, res);
                }

                await session.changeBlueprint(validatedValue);
                return res.send({updated: true});
            }

            if (sessionsCollection.getHostedSession(req.userId!)) {
                return responses.sendCustomError("You cannot start another session since you already are hosting one.", res);
            }
    
            if (sessionsCollection.getJoinedSession(req.userId!)) {
                return responses.sendCustomError("You cannot start a session since you currently are inside of a session.", res);
            }

            if (forExperienceId) {
                const canCreateForExperience = await databaseClient.experienceRepository.isOwnedByUser(forExperienceId, req.userId!);
                if (!canCreateForExperience) {
                    return responses.sendCustomError("You cannot start a session for the given experience.", res);
                }
            }

            const session = await sessionsCollection.startNewSession({
                blueprint: validatedValue,
                hostUserId: req.userId!,
                experienceId: forExperienceId,
            });
            res.send({sessionId: session.id, uniqueSessionId: session.uniqueId});
        })
        .all(responses.wrongMethod);
}) satisfies RouteMaker