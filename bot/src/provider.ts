const enum ItemState {
    notAdded,
    notInstantiated,
    instantiating,
    instantiated,
}

type ItemType<TItem> = abstract new (...otherArgs: any[]) => TItem;
type ItemConstructor<TItem> = new (provider: Provider, ...otherArgs: undefined[]) => TItem;
type ItemFactory<TItem> = (provider: Provider) => TItem;

type ItemInformationType<TItem> = {
    type: ItemType<TItem>;
    state: ItemState;
    
    proxy?: TItem;
    instance?: TItem;
    factory?: ItemFactory<TItem>;
    itemConstructor?: ItemConstructor<TItem>;
};

export default class Provider {
    private readonly items: ItemInformationType<any>[];

    public constructor() {
        this.items = [];
    }

    public add<T>(type: ItemConstructor<T>) {
        const information = this.getNewItemInformationOrThrow(type);

        information.itemConstructor = type;
        information.state = ItemState.notInstantiated;

        return this;
    }

    public addInstance<T>(type: ItemType<T>, instance: T) {
        const information = this.getNewItemInformationOrThrow(type);

        information.instance = instance;
        information.state = ItemState.instantiated;

        return this;
    }

    public addFactory<T>(type: ItemType<T>, factory: ItemFactory<T>) {
        const information = this.getNewItemInformationOrThrow(type);

        information.factory = factory;
        information.state = ItemState.notInstantiated;

        return this;
    }

    public addSuper<T>(type: ItemType<T>, constructor: ItemConstructor<T>) {
        const information = this.getNewItemInformationOrThrow(type);

        information.itemConstructor = constructor;
        information.state = ItemState.notInstantiated;

        return this;
    }

    public getRaw<T>(type: ItemType<T>) {
        const information = this.getItemInformation(type);

        if (information.state === ItemState.notAdded) {
            throw new Error(`${information.type.name} hasn't been added and can't be provided.`);
        }

        if (information.state === ItemState.instantiating) {
            throw new Error(`${information.type.name} is in the middle of being instantiated. This propably means there is a dependency loop.`);
        }

        if (information.state === ItemState.notInstantiated) {
            this.instantiateItem(information);
        }

        if (!information.instance) {
            throw new Error(`Unable to get instance of ${information.type.name}.`);
        }

        return information.instance;
    }

    public get<T extends {}>(type: ItemType<T>) {
        const information = this.getItemInformation(type);
        if (information.proxy) {
            return information.proxy;
        }

        const provider = this;
        function getInstance(): Record<string|symbol,unknown> {
            if (information.instance) {
                return information.instance;
            }
            return provider.getRaw(type);
        }

        const handler: ProxyHandler<T> = {
            has(_, key) {
                return key in getInstance();
            },
            get(_, key) {
                return getInstance()[key];
            },
            set(_, key, value) {
                return getInstance()[key] = value;
            }
        }

        const proxy = new Proxy<T>({} as T, handler);
        information.proxy = proxy;
        return proxy;
    }

    private instantiateItem<T>(information: ItemInformationType<T>) {
        information.state = ItemState.instantiating;
        try {
            if (information.factory) {
                const instance = information.factory(this);
                information.instance = instance;
            } else if (information.itemConstructor) {
                const instance = new information.itemConstructor(this);
                information.instance = instance;
            } else {
                throw new Error(`Unable to instatiate ${information.type.name}. Failed to find factory function or constructor.`);
            }
            information.state = ItemState.instantiated;
        } catch(error) {
            information.state = ItemState.notInstantiated;
            throw error;
        }
    }

    private getNewItemInformationOrThrow<T>(type: ItemType<T>) {
        const information = this.getItemInformation<T>(type);
        if (information.state !== ItemState.notAdded) {
            throw new Error(`${type.name} has already been added to the provider.`);
        }
        return information;
    }

    private getItemInformation<T>(type: ItemType<T>) {
        const itemInformation = this.items.find(item => item.type === type);
        if (itemInformation) {
            return itemInformation as ItemInformationType<T>;
        }

        const newInformation: ItemInformationType<T> = {
            state: ItemState.notAdded,
            type: type,
        }
        this.items.push(newInformation);
        return newInformation;
    }
}