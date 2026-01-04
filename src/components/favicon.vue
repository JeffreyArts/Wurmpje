<template>
    <section>
        <figure id="thumbnail-container" ref="favicon" style="width:128px; height:128px"></figure>
        <figure id="thumbnail-container" ref="androidIcon" style="width:192px; height:192px"></figure>
        <figure id="thumbnail-container" ref="appleTouchIcon" style="width:180px; height:180px"></figure>
    </section>
</template>



<script lang="ts">
import {defineComponent, type PropType} from "vue"
import { ThumbnailController } from "@/tamagotchi/thumbnail-controller"
import { type currentIdentity } from "@/stores/identity"
    
export default defineComponent ({ 
    props: {
        identity: {
            type: Object as PropType<currentIdentity>,
            required: false
        }
    },
    data() {
        return {
            controller: null as ThumbnailController | null,
            length: 0,
            thickness: 0
        }
    },
    watch: {
        
    },
    async mounted() {
        if (!this.identity) {
            throw new Error("No identity provided to Favicon component")
        }

        this.length = this.identity ? this.identity.length : 7
        this.thickness = this.identity ? this.identity.thickness : 40/this.length * 4
        this.createIcon()
        
        this.createFavicon()
        this.createAndroidIcon()
        this.createAppleTouchIcon()
        
    },
    methods: {
        createCanvas(width: number, height: number, target: HTMLElement) {
            const scale = width / 180;
            const length = this.length * scale;
            const thickness = this.thickness * scale;
            let blockSize = 8;
            if (width < 128) {
                blockSize = 4;
            }
            const controller = new ThumbnailController( target, {
                identity: this.identity,
                catterpillarPos: { x: width/2 + (length * thickness) * .2, y: height - thickness * 1.5},
                offsetBottom: thickness * 1.5
            })
            controller.ref.removepointerMoveEvent("lookAtMouse")
            controller.draw.drawBG({blockSize})
            setTimeout(() => controller.catterpillar.contractSpine(0.75, .4), 100)

            const canvas = target.querySelector("#two-js") as HTMLCanvasElement;

            setTimeout(() => {
                controller.destroy()
            }, 3000);

            // wacht tot het canvas is gerenderd
            return new Promise<string>(resolve => {
                setTimeout(() => {
                    const imageData = canvas.toDataURL('image/png');
                    resolve(imageData)
                }, 2000)
            });
        },
        createIcon() {
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
            meta.content = this.identity ? this.identity.name : "Wurmpje";
            document.head.appendChild(meta);
        },
        async createFavicon() {
            // 1. Maak de ThumbnailController aan
            const faviconDataUrl = await this.createCanvas(128, 128, this.$refs.favicon as HTMLElement);

            // 2. Zet de juiste attributen
            const link = document.createElement('link');
            link.rel = 'icon';
            link.sizes = '32x32';
            link.type = 'image/png';
            link.href = faviconDataUrl;

            // 3. Voeg favicon toe aan de pagina
            document.head.appendChild(link);
        },
        
        async createAppleTouchIcon() {
            // 1. Maak de ThumbnailController aan
            const faviconDataUrl = await this.createCanvas(180, 180, this.$refs.appleTouchIcon as HTMLElement);

            // 2. Zet de juiste attributen
            const link = document.createElement('link');
            link.rel = 'apple-touch-icon';
            link.sizes = '180x180';
            link.type = 'icon/png';
            link.href = faviconDataUrl;

            // 3. Creeer meta tag voor apple-mobile-web-app-title
            const meta = document.createElement('meta');
            meta.name = "apple-mobile-web-app-title";
            meta.content = this.identity ? this.identity.name : "Wurmpje";

            
            // 4. Verwijder eventueel bestaande apple-touch-icon links en apple-mobile-web-app-title meta tags
            const existingIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
            existingIcons.forEach(icon => icon.remove());
            const existingMeta = document.querySelectorAll('meta[name="apple-mobile-web-app-title"]');
            existingMeta.forEach(meta => meta.remove());

            // 5. Voeg apple-touch-icon en apple-mobile-web-app-title meta-tag toe aan de pagina
            document.head.appendChild(meta);
            document.head.appendChild(link);
        },
        
        async createAndroidIcon() {
            // 1. Maak de ThumbnailController aan
            const faviconDataUrl = await this.createCanvas(192, 192, this.$refs.appleTouchIcon as HTMLElement);

            // 2. Zet de juiste attributen
            const link = document.createElement('link');
            link.rel = 'icon';
            link.sizes = '192x192';
            link.type = 'icon/png';
            link.href = faviconDataUrl;

            // 3. Voeg icon toe aan de pagina
            document.head.appendChild(link);
        }
        
    }
})
</script>


<style> 

#thumbnail-container {
    opacity: 0;
    pointer-events: none;
    width: 180px;
    height: 180px;
    margin: 0;
    position: fixed;
    top: 0;
    left: 0;
    margin: 0;
    z-index: 2025;

    > div {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
    }
    
    #matter {
        display: none;
    }
}

</style>