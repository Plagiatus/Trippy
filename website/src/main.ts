import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import providerPlugin from './provider/provider-plugin'
import Config from './config'
import SessionsApiClient from './api-clients/sessions-api-client'
import FeedbackApiClient from './api-clients/feedback-api-client'
import MojangApiClient from './api-clients/mojang-api-client'
import AuthenticationHandler from './authentication-handler'
import localConfig from './config/config_local.json';
import prodConfig from './config/config_prod.json';
import Storage from './storage'
import AuthenticationApiClient from './api-clients/authentication-api-client'

createApp(App)
	.use(router)
	.use(providerPlugin({
		providerSetup: provider => provider
			.addFactory(Config, () => {
				if (new URL(window.location.href).hostname == "localhost") {
					return new Config(localConfig);
				} else {
					return new Config(prodConfig);
				}
			})
			.add(SessionsApiClient)
			.add(FeedbackApiClient)
			.add(MojangApiClient)
			.add(AuthenticationApiClient)
			.add(Storage)
			.add(AuthenticationHandler)
	}))
	.mount('#app')
