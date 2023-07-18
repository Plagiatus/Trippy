import DatabaseClient from "../../database-client";
import validationUtils from "../../utils/validation-utils";
import RouteMaker from "../route";
import hash from "object-hash";
import { SessionTemplate } from "../../types/document-types";
import SessionsCollection from "../../session/sessions-collection";

export default (({server, responses, provider, isAuthenticatedGuard}) => { 
    const databaseClient = provider.get(DatabaseClient);
    const sessionsCollection = provider.get(SessionsCollection);

    server.route("/session/:id?")
        .post(isAuthenticatedGuard, async (req, res) => {
            const { validationResult, validatedValue } = validationUtils.valdiateSessionBlueprint(req.body);
            if (!validatedValue) {
                return responses.sendCustomError("Failed to validate template: " + validationResult.errors.map(error => `"${error.property}": ${error.message}`).join(". "), res);
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

            const session = await sessionsCollection.startNewSession(req.userId!, validatedValue);
            res.send({sessionId: session.id});
        })
        .all(responses.wrongMethod);

    server.route("/session/template/:code?")
        .post(isAuthenticatedGuard, async (req, res) => {
            const code: string = parseInt(hash(req.body), 16).toString(36).slice(0, 5);

            const { validationResult, validatedValue } = validationUtils.valdiateSessionBlueprint(req.body);
            if (!validatedValue) {
                return responses.sendCustomError("Failed to validate template: " + validationResult.errors.map(error => `"${error.property}": ${error.message}`).join(". "), res);
            }

            const template: SessionTemplate = { 
                ...validatedValue,
                code,
            }

            await databaseClient.sessionTemplateRepository.add(template);
            res.send({ code });
        })
        .get(isAuthenticatedGuard, async (req, res) => {
            const code = req.params.code;
            if (!code || code.length != 5) {
                return responses.sendCustomError("Code needs to be 5 characters long.", res);
            }
            if (!validationUtils.isAlphaNumeric(code)) {
                return responses.sendCustomError("Code can only be alphanumerical.", res);
            }

            const template = await databaseClient.sessionTemplateRepository.get(code);
            if (!template) {
                return responses.sendCustomError("No template with the given code.", res);
            }

            res.send({...template, code: undefined});
        })
        .all(responses.wrongMethod);
}) satisfies RouteMaker