
import { createRouter, createWebHistory } from 'vue-router';
import Home from "@/views/Home.vue";

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{path: "/", name: "Home", component: Home},
		{path: "/profile", name: "Profiles", component: ()=> import("@/views/Profiles.vue")},
		{path: "/session", name: "Sessions", component: ()=> import("@/views/Sessions.vue")},
		{path: "/session/setup", name: "Sessions.Setup", component: ()=> import("@/views/SessionSetup.vue")},

		{path: "/:pathMatch(.*)*", redirect: "/"}
	],
})