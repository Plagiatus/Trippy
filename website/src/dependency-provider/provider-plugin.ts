import { Plugin } from "vue";
import DependencyProvider from "$/dependency-provider/dependency-provider";
import providerInjectionSymbol from "./provider-injection-symbol";

export default function providerPlugin(options?: {provider?: DependencyProvider, providerSetup?: (provider: DependencyProvider) => void}) {
	const plugin: Plugin = {
		install(app) {
			const provider = options?.provider ?? new DependencyProvider();
			if (options?.providerSetup) {
				options.providerSetup(provider);
			}
			app.provide(providerInjectionSymbol, provider);
		}
	};
	return plugin;
}