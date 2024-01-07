import validationUtils from "../../utils/validation-utils";
import RouteMaker from "../route";
import SessionsCollection from "../../session/sessions-collection";
import Session from "../../session/session";
import DiscordClient from "../../bot/discord-client";
import utils from "../../utils/utils";
import DatabaseClient from "../../database-client";

export default (({server, responses, provider, isAuthenticatedGuard}) => { 
    const sessionsCollection = provider.get(SessionsCollection);
    const databaseClient = provider.get(DatabaseClient);
    const discordClient = provider.get(DiscordClient);

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
                        avatar: user.avatarURL({size: 256}) ?? user.user.avatarURL({size: 256}),
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
                    image: session.blueprint.image,
                }))
            });
        })
        .post(isAuthenticatedGuard, async (req, res) => {
            const noneValidatedBlueprint = typeof req.body === "object" && "blueprint" in req.body && req.body.blueprint;
            const forExperienceId = typeof req.body === "object" && "experienceId" in req.body && typeof req.body.experienceId === "string" ? req.body.experienceId + "" : "";

            const { validationResult, validatedValue } = validationUtils.valdiateSessionBlueprint(noneValidatedBlueprint);
            if (!validatedValue) {
                return responses.sendCustomError("Failed to validate blueprint: " + validationResult.errors.map(error => `"${error.property}": ${error.message}`).join(". "), res);
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

            const session = await sessionsCollection.startNewSession({
                blueprint: validatedValue,
                hostUserId: req.userId!,
                experienceId: forExperienceId,
            });
            res.send({sessionId: session.id});
        })
        .all(responses.wrongMethod);
}) satisfies RouteMaker