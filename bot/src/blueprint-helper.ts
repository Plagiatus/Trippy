import { SessionBlueprint, SimplifiedSessionBlueprint } from "./types/session-blueprint-types";
import jsonSchemas from "./utils/json-schemas";
import ValidationUtils from "./utils/validation-utils";
import sizeOfImage from "image-size";

export default class BlueprintHelper {
	public valdiateSessionBlueprint(value: unknown) {
		return ValidationUtils.validateValueWithJsonSchema<SessionBlueprint>(value, jsonSchemas.sessionBlueprintSchema);
	}

	public validateSessionImage(image: Express.Multer.File) {
		const size = sizeOfImage(image.buffer);
		if (size.type !== "png") {
			throw new Error("Image has to be a png image.");
		}

		if ((size.width ?? 0) > 1280 || (size.height ?? 0) > 720) {
			throw new Error("Image can't be bigger than 1280x720.");
		}
	}

	public conditionalSimplifyBlueprint(simplifyIf: boolean, blueprint: SessionBlueprint): SimplifiedSessionBlueprint|SessionBlueprint {
		if (simplifyIf) {
			return this.simplifyBlueprint(blueprint);
		} else {
			return blueprint;
		}
	}

	public simplifyBlueprint(blueprint: SessionBlueprint): SimplifiedSessionBlueprint {
		return {
			category: blueprint.category,
			description: blueprint.description,
			edition: blueprint.edition,
			name: blueprint.name,
			preferences: blueprint.preferences,
			type: blueprint.type,
			version: blueprint.version,
			imageId: blueprint.imageId,
		}
	}
}
