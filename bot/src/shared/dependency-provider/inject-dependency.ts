import { DependencyKey } from "../types/dependency-provider-types";
import DependencyProvider from "./dependency-provider";
import DependencyReference from "./dependency-reference";

export default function injectDependency<T>(key: DependencyKey<T>, options: {reference: true}): DependencyReference<T>;
export default function injectDependency<T>(key: DependencyKey<T>, options?: {reference?: false}): T;
export default function injectDependency<T>(key: DependencyKey<T>, options?: {reference?: boolean}): T|DependencyReference<T>;
export default function injectDependency<T>(key: DependencyKey<T>, options?: {reference?: boolean}): T|DependencyReference<T> {
	if (options?.reference) {
		return DependencyProvider.activeProvider.getReference(key);
	} else {
		return DependencyProvider.activeProvider.get(key);
	}
}