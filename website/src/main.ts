import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import providerPlugin from './provider/provider-plugin'
import Config from './config'
import SessionsApiClient from './api-clients/sessions-api-client'
import FeedbackApiClient from './api-clients/feedback-api-client'
import MojangApiClient from './api-clients/mojang-api-client'


createApp(App)
	.use(router)
	.use(providerPlugin({
		providerSetup: provider => provider
			.addFactory(Config, () => new Config({apiUrl: (new URL(window.location.href).hostname == "localhost") ? "http://localhost:9009" : "https://api.maptesting.de"}))
			.add(SessionsApiClient)
			.add(FeedbackApiClient)
			.add(MojangApiClient)
	}))
	.mount('#app')
