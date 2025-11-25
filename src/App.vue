<template>
    <router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue"
import gsap from "gsap"
// import { useRouter } from "vue-router"

export default defineComponent({
    name: "appComponent",
    components: {
    },
    data() {
        return {
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
    },
    methods: {
       
    }
})
</script>

