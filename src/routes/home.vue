<template>
    <div class="home">
    <h1>Home</h1>
        <section class="container">
            <button>click here</button>
        </section>
    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import gsap from "gsap"

export default defineComponent ({ 
    name: "homePage",
    components: { 
    },
    props: [],
    setup() {
    },
    data() {
        return {
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
    methods: {
        
    }
})

</script>

<style>
</style>