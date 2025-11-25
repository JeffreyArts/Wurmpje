import App from "./App.vue"
import { createApp } from "vue"
import router from "./routes"
import { createPinia } from "pinia"
// import { createHead } from "@unhead/vue/client"
// import Physics from "./services/physics"


import "./assets/css"
// import App from "./App.vue"

const pinia = createPinia()
        
// pinia.use(({ store }) => {
// })

const app = createApp(App)

// Physics.start(router)
// const head = createHead()

app.use(router)
    .use(pinia)
    // .use(head)
    .mount("#app")
