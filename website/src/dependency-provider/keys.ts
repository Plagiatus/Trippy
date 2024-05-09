import createInjectionKeyAndGetter from "$/dependency-provider/create-injection-key-and-getter";
import type AuthenticationApiClient from "@/api-clients/authentication-api-client";
import type { Router } from "vue-router";

export const {key: authenticationApiClientKey, getter: getAuthenticationApiClient} = createInjectionKeyAndGetter<AuthenticationApiClient>({id: "authentication-api-client"});
export const {key: routerKey, getter: getRouter} = createInjectionKeyAndGetter<Router>({id: "router"});