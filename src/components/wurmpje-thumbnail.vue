<template>
    <section class="wurmpje-thumbnail">
        <figure id="canvas-container"></figure>
    </section>
</template>



<script lang="ts">
import {defineComponent, type PropType} from "vue"
import { MatterController } from "@/tamagotchi/controller"
import { type IdentityField } from "@/models/identity"
        
export default defineComponent ({ 
    props: {
        identityField: {
            type: Object as PropType<IdentityField>,
            required: false
        }
    },
    data() {
        return {
            controller: null as MatterController | null,
            parentIdentity: null as IdentityField | null
        }
    },
    watch: {
        identityField: {
            async handler(val) {
                if (val) {
                    this.createCanvas(this.$el.clientWidth, this.$el.clientHeight, this.$el.querySelector("#canvas-container"), val);
                }
            },
            immediate: true
        }
    },
    async mounted() {
        // const el = this.$el as HTMLElement;
        // const d = el.getBoundingClientRect();
        
        // this.createCanvas(d.width, d.height, el, this.identity);
        
    },
    methods: {
        createCanvas(width: number, height: number, target: HTMLElement, identity: IdentityField) {
            const scale = 1;
            const length = identity.length * scale;
            const thickness = identity.thickness * scale;
            let blockSize = 8;
            if (width < 128) {
                blockSize = 4;
            }
            const controller = new MatterController( target, {
                identity: identity,
                catterpillarPos: { x: width/2 + (length * thickness) * .16, y: height - thickness * 1.5},
                offsetBottom: thickness * 1.5
            })
            controller.ref.removepointerMoveEvent("lookAtMouse")
            controller.draw.drawBG({blockSize})
            setTimeout(() => controller.catterpillar.contractSpine(0.75, .4), 10)

            const canvas = target.querySelector("#two-js") as HTMLCanvasElement;

            // wacht tot het canvas is gerenderd
            // return new Promise<string>(resolve => {
            //     setTimeout(() => {
            //         const imageData = canvas.toDataURL('image/png');
            //         resolve(imageData)
            //     }, 2000)
            // });
        },
        // createIcon() {
        //      // 1. Maak een canvas
        //     const canvas = document.createElement('canvas');
        //     const size = dimensions.width
        //     canvas.width = size;
        //     canvas.height = size;
        //     const ctx = canvas.getContext('2d');

        //     // 2. Teken een rood rondje
        //     ctx.fillStyle = 'red';
        //     ctx.beginPath();
        //     ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        //     ctx.fill();
        // },
        // async createFavicon() {
        //     // 1. Maak de MatterController aan
        //     const faviconDataUrl = await this.createCanvas(128, 128, this.$refs.favicon as HTMLElement);

        //     // 2. Zet de juiste attributen
        //     const link = document.createElement('link');
        //     link.rel = 'icon';
        //     link.sizes = '32x32';
        //     link.type = 'image/png';
        //     link.href = faviconDataUrl;

        //     // 3. Voeg favicon toe aan de pagina
        //     document.head.appendChild(link);
        // },
        
        // async createAppleTouchIcon() {
        //     // 1. Maak de MatterController aan
        //     const faviconDataUrl = await this.createCanvas(180, 180, this.$refs.appleTouchIcon as HTMLElement);

        //     // 2. Zet de juiste attributen
        //     const link = document.createElement('link');
        //     link.rel = 'apple-touch-icon';
        //     link.sizes = '180x180';
        //     link.type = 'icon/png';
        //     link.href = faviconDataUrl;

        //     // 3. Creeer meta tag voor apple-mobile-web-app-title
        //     const meta = document.createElement('meta');
        //     meta.name = "apple-mobile-web-app-title";
        //     meta.content = "Catterpillar name";

            
        //     // 4. Verwijder eventueel bestaande apple-touch-icon links en apple-mobile-web-app-title meta tags
        //     const existingIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
        //     existingIcons.forEach(icon => icon.remove());
        //     const existingMeta = document.querySelectorAll('meta[name="apple-mobile-web-app-title"]');
        //     existingMeta.forEach(meta => meta.remove());

        //     // 5. Voeg apple-touch-icon en apple-mobile-web-app-title meta-tag toe aan de pagina
        //     document.head.appendChild(meta);
        //     document.head.appendChild(link);
        // },
        
        // async createAndroidIcon() {
        //     // 1. Maak de MatterController aan
        //     const faviconDataUrl = await this.createCanvas(192, 192, this.$refs.appleTouchIcon as HTMLElement);

        //     // 2. Zet de juiste attributen
        //     const link = document.createElement('link');
        //     link.rel = 'icon';
        //     link.sizes = '192x192';
        //     link.type = 'icon/png';
        //     link.href = faviconDataUrl;

        //     // 3. Voeg icon toe aan de pagina
        //     document.head.appendChild(link);
        // }
        
    }
})
</script>


<style> 

.wurmpje-thumbnail {
    width: 100%;
    margin: 0;
    
    #canvas-container {
        width: 100%;
        margin: 0;
        padding: 0;
        aspect-ratio: 1 / 1;
        position: relative;
        #matter {
            display: none;
        }
    }
}

</style>