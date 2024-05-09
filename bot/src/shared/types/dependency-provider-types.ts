import type DependencyProvider from "../dependency-provider/dependency-provider";

export type DependencyConstructorKey<TItem> = abstract new (...args: any[]) => TItem;
export type DependencySymbolKey<TItem> = symbol&{item?: TItem};
export type DependencyKey<TItem> = DependencyConstructorKey<TItem>|DependencySymbolKey<TItem>;
export type DependencyConstructor<TItem> = new (provider: DependencyProvider, ...otherArgs: undefined[]) => TItem;
export type DependencyFactory<TItem> = (provider: DependencyProvider) => TItem;