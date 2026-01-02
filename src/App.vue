<template>
    <router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue"
import gsap from "gsap"
import useIdentityStore from "@/stores/identity"
import useActionStore from "@/stores/action"

export default defineComponent({
    name: "appComponent",
    components: {
    },
    data() {
        return {
        }
    },
    setup() {
        const identityStore = useIdentityStore()
        const actionStore = useActionStore()

        actionStore.init()
        identityStore.init()
        
        return {
            identityStore,
            actionStore
        }
    },
    mounted() {
        if (typeof window !== "undefined") {
            gsap.to("body", {
                "--bg-size": 8,
                backgroundPosition: "calc(48px * 2) 48px",
                duration:.8
            })
        }
    }
})
</script>

