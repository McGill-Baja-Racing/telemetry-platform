import { VueQueryPlugin } from "@tanstack/vue-query";
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { handleHotUpdate, routes } from "vue-router/auto-routes";
import App from "./App.vue";
import "./style.css";

const router = createRouter({ history: createWebHistory(), routes });
if (import.meta.hot) handleHotUpdate(router);

createApp(App).use(router).use(VueQueryPlugin).mount("#app");
