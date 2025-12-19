// import type { DefineComponent } from "vue"
import Error404 from "@/routes/error-404.vue"
import Home from "@/routes/home.vue"
import Setup from "@/routes/setup.vue"
import Scan from "@/routes/scan.vue"

import { createWebHistory, createRouter } from "vue-router"

const routes = [
    {
        path: "/",
        name: "home",
        component: Home,
    },
    {
        path: "/scan",
        name: "scan",
        component: Scan,
    },
    {
        path: "/hi",
        name: "setup",
        component: Setup,
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
