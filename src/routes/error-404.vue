<template>
    <div class="page-404">
        <h1 class="page-404-title">
            404 not <br>found
        </h1>
        <h3>{{ message }}</h3>
    </div>
</template>


<script lang="ts">
import { defineComponent } from 'vue'
import gsap from "gsap"
// import { useHead }  from "@unhead/vue"

export default defineComponent ({ 
    name: "errorPage404",
    components: { 
    },
    props: [],
    data() {
        return {
            title: "404 not found",
            messages: [
                "Error 404",
                "404",
                "Page not found",
                "404 Error",
                "Not Found",
                "Page Missing",
                "Oops! Page not found",
                "Aie! Page not found",
                "We can't find that page",
                "404: Page does not exist",
                "This page isn't available",
                "Page unavailable",
                "Lost in cyberspace",
                "Hmmmm... I can't find this page",
                "This page got lost in cyberspace",
                "The page has vanished",
                "404: Page not here",
                "Page gone missing",
                "404: We couldn't find that",
                "Oops! This page got lost somewhere",
                "This link is broken",
                "Dead link: 404",
                "404: Not here",
                "The requested URL was not found"
            ],
            layer2glitchInputs: [] as Array<Array<string>>,
            glitchInputs: [] as Array<Array<string>>
        }
    },
    head: { 
        title: "Home",
        meta: [
            {
                name: "description",
                content: "Lorem ipsum dolor samet...",
            },
        ]
    },
    mounted() {

        // Animation for Title block
        gsap.fromTo("h1", {
            fontWeight: 400,
            fontStretch: 80,
        },{
            fontWeight: 800,
            fontStretch: 100,
            ease:"bounce.out",
            duration: .8 
        })
    },
    computed: {
        message() {
            return this.messages[Math.floor(Math.random() * this.messages.length)]
        }
    },
    methods: {
        
    }
})

</script>

<style>
.page-404 {
    display: flex;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    flex-flow: row wrap;
    gap: 40px;
    justify-content: center;
    align-items: center;
    font-size: 2vw;
}
.page-404-title {
    position: absolute;
    top: 50%;
    left: 50%;
    display: inline-block;
    width: 50vw;
    z-index: 2024;
    translate: -50% -50%;
    font-size: 8vw;
    margin: 0;
    padding: 0;
    text-shadow: 0 0 8px rgba(255,255,255.8);
}

</style>