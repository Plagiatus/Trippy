
import { createRouter, createWebHistory } from 'vue-router';
import Home from "@/views/Home.vue";

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{path: "/", name: "Home", component: Home},
		{path: "/profile", name: "Profiles", component: ()=> import("@/views/Profiles.vue")},

		{path: "/session", name: "Sessions", component: ()=> import("@/views/Sessions.vue")},
		{path: "/session/setup", name: "Sessions.Setup", component: ()=> import("@/views/SessionSetup.vue")},
		{path: "/session/feedback/:feedbackId?", name: "Sessions.Feedback", component: ()=> import("@/views/SessionFeedback.vue")},

		{path: "/login/authenticated", name: "Login.Authenticated", component: ()=> import("@/views/LoginAuthenticated.vue")},
		{path: "/login/token", name: "Login.Token", component: ()=> import("@/views/LoginToken.vue")},

		{path: "/:pathMatch(.*)*", redirect: "/"}
	],
})