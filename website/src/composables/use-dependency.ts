import providerInjectionSymbol from "@/dependency-provider/provider-injection-symbol";
import Provider from "$/dependency-provider/dependency-provider";
import { inject } from "vue";
import { DependencyKey } from "$/types/dependency-provider-types";

export default function useDependency<T extends {}>(key: DependencyKey<T>) {
	const provider = inject(providerInjectionSymbol, () => new Provider(), true);
	return provider.get<T>(key);
}