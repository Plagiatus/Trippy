import { createRouter, createWebHistory, Router } from 'vue-router';
import Home from "@/views/Home.vue";
import Provider from '$/provider/provider';
import AuthenticationHandler from './authentication-handler';

export default class RouterWrapper {
	public readonly router: Router;

	public constructor(provider: Provider) {
		this.router = this.createRouter();
		this.setupAuthentication(provider);
	}

	private createRouter() {
		return createRouter({
			history: createWebHistory(),
			routes: [
				{path: "/", name: "Home", component: Home, meta: {anonymous: true}},
	
				{path: "/experience", name: "Experience", component: ()=> import("@/views/experience/Experiences.vue")},
				{path: "/experience/create", name: "Experience.New", component: ()=> import("@/views/experience/CreateExperience.vue")},
				{path: "/experience/:experienceId", name: "Experience.Overview", component: ()=> import("@/views/experience/ExperienceOverview.vue")},
				{path: "/experience/:experienceId/edit", name: "Experience.Edit", component: ()=> import("@/views/experience/EditExperience.vue")},
	
				{path: "/session", name: "Session", component: ()=> import("@/views/session/Sessions.vue")},
				{path: "/session/create/:experienceId?", name: "Session.Create", component: ()=> import("@/views/session/CreateSession.vue")},
				{path: "/session/:sessionId", name: "Session.Overview", component: ()=> import("@/views/session/SessionOverview.vue")},
				{path: "/session/:sessionId/edit", name: "Session.Edit", component: ()=> import("@/views/session/EditSession.vue")},
	
				{path: "/login/authenticated", name: "Login.Authenticated", component: ()=> import("@/views/LoginAuthenticated.vue"), meta: {anonymous: true}},
				{path: "/login/token", name: "Login.Token", component: ()=> import("@/views/LoginToken.vue"), meta: {anonymous: true}},
	
				{path: "/:pathMatch(.*)*", redirect: {name: "Home"}, meta: {anonymous: true}}
			],
		});
	}

	private setupAuthentication(provider: Provider) {
		const authenticationHandler = provider.get(AuthenticationHandler);
		this.router.beforeEach((to, from, next) => {
			if (to.meta.anonymous || authenticationHandler.isLoggedIn()) {
				next();
			} else {
				next({name: "Home"});
			}
		});
	}
}