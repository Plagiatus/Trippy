import RouteMaker from "../route";
import DatabaseClient from "../../database-client";
import utils from "../../utils/utils";
import { ExperienceData } from "../../types/document-types";
import RecommendationHelper from "../../recommendation-helper";
import DiscordClient from "../../bot/discord-client";
import BlueprintHelper from "../../blueprint-helper";

export default (({server, responses, provider, isAuthenticatedGuard}) => { 
    const databaseClient = provider.get(DatabaseClient);
    const recommendationHelper = provider.get(RecommendationHelper);
    const discordClient = provider.get(DiscordClient);
    const blueprintHelper = provider.get(BlueprintHelper);

    server.route("/experience/:id?")
        .get(isAuthenticatedGuard, async (req, res) => {
            if (req.params.id) {
                const experience = await databaseClient.experienceRepository.get(req.params.id);
                if (!experience) {
                    return responses.sendCustomError(`Failed to get experience with the id "${req.params.id}".`, res);
                }

                const owners = await utils.asyncMap(experience.owners.map(owner => owner.userId), id => discordClient.getSimplifiedMember(id));
                const ownsExperience = experience.owners.some(owner => owner.userId === req.userId);

				return res.send({
                    ownsExperience: ownsExperience,
                    id: experience.id,
                    owners: owners,
                    defaultBlueprint: blueprintHelper.conditionalSimplifyBlueprint(!ownsExperience, experience.defaultBlueprint),
                });
			}
            
            const ownedExperiences = await databaseClient.experienceRepository.getOwnedByUser(req.userId!);
            res.send({
                experiences: ownedExperiences.map(experience => ({
                    id: experience.id,
                    name: experience.defaultBlueprint.name,
                    imageId: experience.defaultBlueprint.imageId,
                }))
            })
        })
        .post(isAuthenticatedGuard, async (req, res) => {
            const blueprintData = typeof req.body === "object" && "defaultBlueprint" in req.body ? JSON.parse(req.body.defaultBlueprint) : null;
            const { validationResult, validatedValue } = blueprintHelper.valdiateSessionBlueprint(blueprintData);
            const removeImage = typeof req.body === "object" && "removeImage" in req.body;
            const imageFile = Array.isArray(req.files) ? req.files.find(file => file.fieldname === "image") : undefined;

            if (!validatedValue) {
                return responses.sendCustomError("Failed to validate blueprint: " + validationResult.errors.map(error => `"${error.property}": ${error.message}`).join(". "), res);
            }

            const userInformation = await databaseClient.userRepository.get(req.userId!);
            if (recommendationHelper.canUseImages(userInformation)) {
                if (imageFile) {
                    try {
                        blueprintHelper.validateSessionImage(imageFile);
                    } catch(error) {
                        if (error instanceof Error) {
                            return responses.sendCustomError(error.message, res);
                        }
                        throw error;
                    }
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
        .delete(isAuthenticatedGuard, async (req, res) => {
            if (!req.params.id) {
                return;
			}

            const experience = await databaseClient.experienceRepository.get(req.params.id);
            if (!experience || !experience.owners.some(owner => owner.userId === req.userId)) {
                return responses.sendCustomError(`Failed to delete experience with the id "${req.params.id}".`, res);
            }

            await databaseClient.experienceRepository.remove(experience);
            res.send({
                deleted: true,
            });
        })
        .all(responses.wrongMethod);
}) satisfies RouteMaker