import { createApp } from 'vue'
import App from './App.vue'
import providerPlugin from './dependency-provider/provider-plugin'
import Config from './config'
import SessionApiClient from './api-clients/session-api-client'
import MojangApiClient from './api-clients/mojang-api-client'
import AuthenticationHandler from './authentication-handler'
import localConfig from './config/config_local.json';
import prodConfig from './config/config_prod.json';
import Storage from './storage'
import AuthenticationApiClient from './api-clients/authentication-api-client'
import ExperienceApiClient from './api-clients/experience-api-client'
import FileAccess from './file-access'
import ImageApiClient from './api-clients/image-api-client'
import TimeHelper from './time-helper'
import Provider from '$/dependency-provider/dependency-provider'
import RouterWrapper from './router'
import TrippyController from './trippy-controller'
import SettingsApiClient from './api-clients/settings-api-client'
import { authenticationApiClientKey, routerKey } from './dependency-provider/keys'
import TagsHelper from "$/tags-helper";
import StatsApiClient from './api-clients/stats-api-client'

const provider = new Provider()
	.addFactory(Config, () => {
		if (new URL(window.location.href).hostname == "localhost") {
			return new Config(localConfig);
		} else {
			return new Config(prodConfig);
		}
	})
	.addConstructor(SessionApiClient)
	.addConstructor(MojangApiClient)
	.addConstructor(authenticationApiClientKey, AuthenticationApiClient)
	.addConstructor(Storage)
	.addConstructor(AuthenticationHandler)
	.addConstructor(ExperienceApiClient)
	.addConstructor(SettingsApiClient)
	.addConstructor(StatsApiClient)
	.addConstructor(FileAccess)
	.addConstructor(ImageApiClient)
	.addConstructor(TimeHelper)
	.addConstructor(TrippyController)
	.addFactory(TagsHelper, () => new TagsHelper())
	.addFactory(routerKey, (provider) => new RouterWrapper(provider).router);

createApp(App)
	.use(provider.get(routerKey))
	.use(providerPlugin({ provider: provider }))
	.mount('#app');
