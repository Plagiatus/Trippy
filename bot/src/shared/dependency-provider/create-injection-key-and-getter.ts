import { DependencySymbolKey } from "../types/dependency-provider-types";
import DependencyReference from "./dependency-reference";
import injectDependency from "./inject-dependency";

export default function createInjectionKeyAndGetter<T>(options?: {id?: string}) {
	const key = (options?.id === undefined ? Symbol() : Symbol.for(options.id)) as DependencySymbolKey<T>;

	function getter(options: {reference: true}): DependencyReference<T>
	function getter(options?: {reference?: false}): T
	function getter(options?: {reference?: boolean}): T|DependencyReference<T>
	function getter(options?: {reference?: boolean}): T|DependencyReference<T> {
		return injectDependency(key, {reference: options?.reference});
	}

	return { key, getter };
}