import DatabaseClient from "../../database-client";
import validationUtils from "../../utils/validation-utils";
import RouteMaker from "../route";
import hash from "object-hash";
import { SessionTemplate } from "../../types/document-types";

export default (({server, responses, provider}) => { 
    const databaseClient = provider.get(DatabaseClient);

    server.route("/session/template/:code?")
        .post(async (req, res) => {
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
        .get(async (req, res) => {
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

            res.send(template);
        })
        .all(responses.wrongMethod);
}) satisfies RouteMaker