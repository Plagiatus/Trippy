import { DependencyConstructor, DependencyFactory, DependencyKey } from "./../types/dependency-provider-types";
import DependencyReference from "./dependency-reference";

const enum ItemState {
	notAdded,
	notInstantiated,
	instantiating,
	instantiated,
}

type DependencyInformation<TItem> = {
	state: ItemState;
	
	reference?: DependencyReference<TItem>;
	instance?: TItem;
	factory?: DependencyFactory<TItem>;
	itemConstructor?: DependencyConstructor<TItem>;
};

export default class DependencyProvider {
	private static activeProviderOrNull: DependencyProvider|null = null;

	private readonly dependencies: Map<DependencyKey<unknown>, DependencyInformation<unknown>>;

	public constructor() {
		this.dependencies = new Map();
	}

	public static get activeProvider() {
		if (!this.activeProviderOrNull) {
			throw new Error("There is currently no active providers.");
		}

		return this.activeProviderOrNull;
	}

	public activate<TReturn>(run: () => TReturn): TReturn {
		const lastActiveProvider = DependencyProvider.activeProviderOrNull;
		DependencyProvider.activeProviderOrNull = this;
		
		try {
			return run();
		} finally {
			DependencyProvider.activeProviderOrNull = lastActiveProvider;
		}
	}

	public addConstructor<T>(key: DependencyKey<T>, itemConstructor: DependencyConstructor<T>): DependencyProvider
	public addConstructor<T>(itemConstructor: DependencyConstructor<T>): DependencyProvider
	public addConstructor<T>(key: DependencyKey<T>|DependencyConstructor<T>, itemConstructor?: DependencyConstructor<T>): DependencyProvider {
		const information = this.getNewItemInformationOrThrow(key);
		
		if (itemConstructor) {
			information.itemConstructor = itemConstructor;
		} else {
			information.itemConstructor = key as DependencyConstructor<T>;
		}

		information.state = ItemState.notInstantiated;
		return this;
	}

	public addInstance<T>(key: DependencyKey<T>, instance: T) {
		const information = this.getNewItemInformationOrThrow(key);

		information.instance = instance;
		information.state = ItemState.instantiated;

		return this;
	}

	public addFactory<T>(key: DependencyKey<T>, factory: DependencyFactory<T>) {
		const information = this.getNewItemInformationOrThrow(key);

		information.factory = factory;
		information.state = ItemState.notInstantiated;

		return this;
	}

	public get<T>(key: DependencyKey<T>) {
		const information = this.getItemInformation(key);

		if (information.state === ItemState.notAdded) {
			throw new Error(`${this.getKeyName(key)} hasn't been added and can't be provided.`);
		}

		if (information.state === ItemState.instantiating) {
			throw new Error(`${this.getKeyName(key)} is in the middle of being instantiated. This propably means there is a dependency loop.`);
		}

		if (information.state === ItemState.notInstantiated) {
			this.instantiateItem(information, key);
		}

		if (!information.instance) {
			throw new Error(`Unable to get instance of ${this.getKeyName(key)}.`);
		}

		return information.instance;
	}

	public getReference<T>(key: DependencyKey<T>) {
		const itemInformation = this.getItemInformation(key);
		if (itemInformation.reference) {
			return itemInformation.reference;
		}
		
		itemInformation.reference = new DependencyReference(this, key);
		return itemInformation.reference;
	}

	private instantiateItem<T>(information: DependencyInformation<T>, key: DependencyKey<T>) {
		information.state = ItemState.instantiating;
		try {
			this.activate(() => {
				if (information.factory) {
					const instance = information.factory(this);
					information.instance = instance;
				} else if (information.itemConstructor) {
					const instance = new information.itemConstructor(this);
					information.instance = instance;
				} else {
					throw new Error(`Unable to instatiate ${this.getKeyName(key)}. Failed to find factory function or constructor.`);
				}
			});
			information.state = ItemState.instantiated;
		} catch(error) {
			information.state = ItemState.notInstantiated;
			throw new Error(`Failed to instantiate ${this.getKeyName(key)}: ${error}`);
		}
	}

	private getNewItemInformationOrThrow<T>(key: DependencyKey<T>) {
		const information = this.getItemInformation<T>(key);
		if (information.state !== ItemState.notAdded) {
			throw new Error(`${this.getKeyName(key)} has already been added to the provider.`);
		}
		return information;
	}

	private getItemInformation<T>(key: DependencyKey<T>) {
		const itemInformation = this.dependencies.get(key);
		if (itemInformation) {
			return itemInformation as DependencyInformation<T>;
		}

		if (typeof key === "function") {
			const itemInformationByName = Array.from(this.dependencies.entries()).find(([existingKey]) => typeof existingKey === "function" && existingKey.name === key.name);
			if (itemInformationByName) {
				return itemInformationByName[1] as DependencyInformation<T>;
			}
		}

		const newInformation: DependencyInformation<T> = {
			state: ItemState.notAdded,
		}
		this.dependencies.set(key, newInformation);
		return newInformation;
	}

	private getKeyName(key: DependencyKey<unknown>) {
		if (typeof key === "symbol") {
			return "@" + (key.description ?? "unique-symbol");
		} else {
			return key.name;
		}
	}
}