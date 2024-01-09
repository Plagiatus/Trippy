import { SessionBlueprint } from "../types/session-blueprint-types";
import { validate, type Schema } from "jsonschema";
import jsonSchemas from "./json-schemas";
import sizeOfImage from "image-size";

class ValidationUtils {
	isAlphaNumeric(str: string): boolean {
		for (let i = 0; i < str.length; i++) {
			let code = str.charCodeAt(i);
			if (!(code > 47 && code < 58) && // numeric (0-9)
					!(code > 64 && code < 91) && // upper alpha (A-Z)
					!(code > 96 && code < 123)) { // lower alpha (a-z)
				return false;
			}
		}
		return true;
	};

	valdiateSessionBlueprint(value: unknown) {
		return this.validateValueWithJsonSchema<SessionBlueprint>(value, jsonSchemas.sessionBlueprintSchema);
	}

	private validateValueWithJsonSchema<T>(value: unknown, schema: Schema) {
		const validationResult = validate(value, schema);

		return {
			validationResult,
			validatedValue: validationResult.valid ? value as T : null,
		}
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
}

export default new ValidationUtils();