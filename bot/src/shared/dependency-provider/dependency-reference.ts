import type { DependencyKey } from "../types/dependency-provider-types";
import type DependencyProvider from "./dependency-provider";

export default class DependencyReference<T> {
	private cachedDependency: undefined|{dependency: T};

	public constructor(private readonly dependencyProvider: DependencyProvider, private readonly key: DependencyKey<T>) {

	}

	public get value() {
		if (this.cachedDependency) {
			return this.cachedDependency.dependency;
		}

		this.cachedDependency = {
			dependency: this.dependencyProvider.get(this.key)
		}

		return this.cachedDependency.dependency;
	}
}