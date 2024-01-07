import { createRouter, createWebHistory } from 'vue-router';
import Home from "@/views/Home.vue";

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{path: "/", name: "Home", component: Home},

		{path: "/experience", name: "Experience", component: ()=> import("@/views/experience/Experiences.vue")},
		{path: "/experience/create", name: "Experience.New", component: ()=> import("@/views/experience/CreateExperience.vue")},
		{path: "/experience/:experienceId", name: "Experience.Overview", component: ()=> import("@/views/experience/ExperienceOverview.vue")},
		{path: "/experience/:experienceId/edit", name: "Experience.Edit", component: ()=> import("@/views/experience/EditExperience.vue")},

		{path: "/session", name: "Session", component: ()=> import("@/views/session/Sessions.vue")},
		{path: "/session/create/:experienceId?", name: "Session.Create", component: ()=> import("@/views/session/CreateSession.vue")},
		{path: "/session/:sessionId", name: "Session.Overview", component: ()=> import("@/views/session/SessionOverview.vue")},
		{path: "/session/:sessionId/edit", name: "Session.Edit", component: ()=> import("@/views/session/EditSession.vue")},

		{path: "/login/authenticated", name: "Login.Authenticated", component: ()=> import("@/views/LoginAuthenticated.vue")},
		{path: "/login/token", name: "Login.Token", component: ()=> import("@/views/LoginToken.vue")},

		{path: "/:pathMatch(.*)*", redirect: "/"}
	],
})