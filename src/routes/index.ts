// import type { DefineComponent } from "vue"
import Error404 from "@/routes/error-404.vue"
import Home from "@/routes/home.vue"

import { createWebHistory, createRouter } from "vue-router"

const routes = [
    {
        path: "/",
        // name: "404 | Not found",
        component: Home,
    },
    {
        path: "/:pathMatch(.*)*",
        name: "404 | Not found",
        component: Error404,
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
