import RouteMaker from "../route";
import SessionsCollection from "../../session/sessions-collection";
import DiscordClient from "../../bot/discord-client";
import utils from "../../utils/utils";
import DatabaseClient from "../../database-client";
import RecommendationHelper from "../../recommendation-helper";
import registerCommand from "../../bot/interactions/commands/register-command";
import { RawSession } from "../../types/document-types";
import BlueprintHelper from "../../blueprint-helper";
import injectDependency from "../../shared/dependency-provider/inject-dependency";
import { getIsAuthenticatedGuard } from "../guards/is-authenticated-guard";

export default (({server, responses}) => { 
    const sessionsCollection = injectDependency(SessionsCollection);
    const databaseClient = injectDependency(DatabaseClient);
    const discordClient = injectDependency(DiscordClient);
    const recommendationHelper = injectDependency(RecommendationHelper);
    const blueprintHelper = injectDependency(BlueprintHelper);

    server.route("/session/millisecondsTillPing")
        .get(getIsAuthenticatedGuard(), async (req, res) => {
            const userData = await databaseClient.userRepository.get(req.userId!);
			const millisecondsTillNextPing = recommendationHelper.getMillisecondsTillNextAllowedPing(userData);

			res.send({millisecondsTillNextPing});
        })
        .all(responses.wrongMethod);

    server.get("/session/:id", getIsAuthenticatedGuard(), async (req, res) => {
        const rawSession = await databaseClient.sessionRepository.get(req.params.id);
        if (!rawSession) {
            return responses.sendCustomError(`Unable to get session with id "${req.params.id}".`, res);
        }
        const session = sessionsCollection.getSession(rawSession.id);
        const usersInSession = await utils.asyncMap(session?.joinedUserIds ?? [], id => discordClient.getSimplifiedMember(id));
        const host = await discordClient.getSimplifiedMember(rawSession.hostId);
        const isHost = rawSession.hostId === req.userId;
        const experience = rawSession.experinceId === undefined ? null : await databaseClient.experienceRepository.get(rawSession.experinceId);

        return res.send({
            state: rawSession.state,
            blueprint: blueprintHelper.conditionalSimplifyBlueprint(!isHost, rawSession.blueprint),
            id: rawSession.id,
            uniqueId: rawSession.uniqueId,
            users: usersInSession,
            host: host,
            isHost: isHost,
            hasJoined: rawSession.players.some(player => player.id === req.userId),
            startedAt: rawSession.state === "new" ? undefined : rawSession.startTime,
            experience: !experience ? undefined : {
                id: experience.id,
                name: experience.defaultBlueprint.name,
            }
        });
    });

    server.get("/session", getIsAuthenticatedGuard(), async (req, res) => {
        const hostingSession = sessionsCollection.getHostedSession(req.userId!);
        const inSession = sessionsCollection.getJoinedSession(req.userId!);

        const latestHostedSessions = await databaseClient.sessionRepository.getLatestHostedSessions(req.userId!, 10);
        const latestJoinedSessions = await databaseClient.sessionRepository.getLatestJoinedSessions(req.userId!, 10);

        function simplifySessionInformation(session: RawSession|undefined) {
            if (!session) {
                return undefined;
            }

            return {
                uniqueId: session.uniqueId,
                id: session.id,
                name: session.blueprint.name,
                imageId: session.blueprint.imageId,
            }
        }

        return res.send({
            hostingSession: simplifySessionInformation(hostingSession?.rawSession),
            inSession: simplifySessionInformation(inSession?.rawSession),
            latestHostedSessions: latestHostedSessions.map(session => simplifySessionInformation(session)),
            latestJoinedSessions: latestJoinedSessions.map(session => simplifySessionInformation(session)),
        });
    });

    server.route("/session/:id?")
        .post(getIsAuthenticatedGuard(), async (req, res) => {
            const noneValidatedBlueprint = typeof req.body === "object" && "blueprint" in req.body ? JSON.parse(req.body.blueprint) : null;
            const forExperienceId = typeof req.body === "object" && "experienceId" in req.body && typeof req.body.experienceId === "string" ? req.body.experienceId + "" : "";
            const removeImage = typeof req.body === "object" && "removeImage" in req.body;
            const imageFile = Array.isArray(req.files) ? req.files.find(file => file.fieldname === "image") : undefined;

            const { validationResult, validatedValue } = blueprintHelper.valdiateSessionBlueprint(noneValidatedBlueprint);
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
                    blueprintHelper.validateSessionImage(imageFile);
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