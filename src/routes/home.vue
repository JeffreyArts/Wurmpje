<template>
    <div class="home">
        <matter-box class="matter-box"/>
    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import gsap from "gsap"
import matterBox from "@/components/matter-box.vue";

export default defineComponent ({ 
    name: "homePage",
    components: { 
        matterBox
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
this.createIcon()
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
        createIcon() {
            console.log("Creating favicon");
             // 1. Maak een canvas
            const canvas = document.createElement('canvas');
            const size = 180; // 180x180 pixels
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // 2. Teken een rood rondje
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();

            // 3. Converteer naar Base64
            const faviconDataUrl = canvas.toDataURL('image/png');

            // 4. Voeg favicon toe aan de pagina
            const link = document.createElement('link');
            link.rel = 'apple-touch-icon';
            link.sizes = '180x180';
            link.type = 'icon/png';
            link.href = faviconDataUrl;
            

            // Verwijder eventueel bestaande favicons
            const existingIcons = document.querySelectorAll('link[rel="icon"]');
            existingIcons.forEach(icon => icon.remove());

            document.head.appendChild(link);

            const meta = document.createElement('meta');
            meta.name = "apple-mobile-web-app-title";
            meta.content = "My name is Jefff";
            document.head.appendChild(meta);
        }
    }
})

</script>

<style>
.matter-box {
    width: 100%;
    height: calc(100vh - 144px);
}
</style>