import RouteMaker from "../route";
import validationUtils from "../../utils/validation-utils";
import DatabaseClient from "../../database-client";
import utils from "../../utils/utils";
import { ExperienceData } from "../../types/document-types";

export default (({server, responses, provider, isAuthenticatedGuard}) => { 
    const databaseClient = provider.get(DatabaseClient);

    server.route("/experience/:id?")
        .get(isAuthenticatedGuard, async (req, res) => {
            if (req.params.id) {
                const experience = await databaseClient.experienceRepository.get(req.params.id);
                if (!experience || !experience.owners.some(owner => owner.userId === req.userId)) {
                    return responses.sendCustomError(`Failed to get experience with the id "${req.params.id}".`, res);
                }
				return res.send({
                    experience: experience
                });
			}
            
            const ownedExperiences = await databaseClient.experienceRepository.getOwnedByUser(req.userId!);
            res.send({
                experiences: ownedExperiences.map(experience => ({
                    id: experience.id,
                    name: experience.defaultBlueprint.name,
                    image: experience.defaultBlueprint.image,
                }))
            })
        })
        .post(isAuthenticatedGuard, async (req, res) => {
            const blueprintData = typeof req.body === "object" && "defaultBlueprint" in req.body ? req.body.defaultBlueprint : null;
            const { validationResult, validatedValue } = validationUtils.valdiateSessionBlueprint(blueprintData);
            if (!validatedValue) {
                return responses.sendCustomError("Failed to validate blueprint: " + validationResult.errors.map(error => `"${error.property}": ${error.message}`).join(". "), res);
            }

            if (req.params.id) {
                const experience = await databaseClient.experienceRepository.get(req.params.id);
                if (!experience || !experience.owners.some(owner => owner.userId === req.userId)) {
                    return responses.sendCustomError(`Unable to change experience with id "${req.params.id}".`, res);
                }
                experience.defaultBlueprint = validatedValue;
                await databaseClient.experienceRepository.update(experience);
                return res.send({updated: true});
            }

            const experienceId = utils.newId();
            const newExperience: ExperienceData = {
                id: experienceId,
                defaultBlueprint: validatedValue,
                owners: [{
                    userId: req.userId!,
                }],
            }
            await databaseClient.experienceRepository.add(newExperience);
            res.send({
                experienceId: experienceId
            });
        })
        .all(responses.wrongMethod);
}) satisfies RouteMaker