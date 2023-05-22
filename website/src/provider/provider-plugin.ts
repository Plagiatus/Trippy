import { Plugin } from "vue";
import Provider from "./provider";
import providerInjectionSymbol from "./provider-injection-symbol";

export default function providerPlugin(options?: {provider?: Provider, providerSetup?: (provider: Provider) => void}) {
	const plugin: Plugin = {
		install(app) {
			const provider = options?.provider ?? new Provider();
			if (options?.providerSetup) {
				options.providerSetup(provider);
			}
			app.provide(providerInjectionSymbol, provider);
		}
	};
	return plugin;
}