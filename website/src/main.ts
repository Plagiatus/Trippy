import { createApp } from 'vue'
import App from './App.vue'
import createMainRouter from './router'
import providerPlugin from './provider/provider-plugin'
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
import Provider from './provider/provider'
import RouterWrapper from './router'
import TrippyController from './trippy-controller'
import SettingsApiClient from './api-clients/settings-api-client'

const provider = new Provider()
	.addFactory(Config, () => {
		if (new URL(window.location.href).hostname == "localhost") {
			return new Config(localConfig);
		} else {
			return new Config(prodConfig);
		}
	})
	.add(SessionApiClient)
	.add(MojangApiClient)
	.add(AuthenticationApiClient)
	.add(Storage)
	.add(AuthenticationHandler)
	.add(ExperienceApiClient)
	.add(SettingsApiClient)
	.add(FileAccess)
	.add(ImageApiClient)
	.add(TimeHelper)
	.add(TrippyController)
	.add(RouterWrapper);

createApp(App)
	.use(provider.get(RouterWrapper).router)
	.use(providerPlugin({ provider: provider }))
	.mount('#app');
