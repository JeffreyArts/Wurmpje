<template>
    <div class="qr-code-container" v-if="identity.current">

        <router-link class="page-go-back" to="/">
            <jao-icon name="chevron-left-fat" size="small" inactive-color="transparent" active-color="currentColor"/>
            <span>Go back</span>
        </router-link>

        

        <div class="qr-code-canvas-container">
            <div class="qr-code-canvas-title">
                 {{ parent }} {{ identity.current.name }}
            </div>
            <wurmpjeThumbnail type="flat" class="wurmpje" :identityField="identity.current" />
            <div v-html="svg" id="qr-code-svg"></div>
            <div class="descriptive-note">
                Scan the QR to make a new baby wurmpje
            </div>
        </div>

        
        <div class="qr-code-scanner-icon-container">
             <router-link to="/scan" class="qr-code-scanner-icon">
                <jaoIcon name="camera" size="large" inactive-color="transparent" activeColor="var(--contrast-color)"/>
                <figcaption class="descriptive-note">
                    or click on the camera to search for a wurmpje in any QR code
                </figcaption>
            </router-link>
        </div>
    </div>


</template>

<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import jaoIcon from "@/components/jao-icon.vue"
import Identity, { type IdentityField } from "@/models/identity"
import gsap from "gsap"
import qrcode from "qrcode"
import wurmpjeThumbnail from "@/components/wurmpje-thumbnail.vue"

export default defineComponent({
    name: "qrCodePage",
    components: {
        jaoIcon,
        wurmpjeThumbnail
    },
    computed: {
        parent(): string {
            if (!this.identity.current) {
                return ""
            }
            
            if (this.identity.current.gender == 1) {
                return "Mommy"
            } else {
                return "Daddy"
            }
        }
    },
    props: [],
    setup() {
        try {
            const identityStore = useIdentityStore()
            identityStore.init()

            

            return {
                identity: identityStore,
            }
        } catch (e) {
            console.error("Failed to initialise identity store:", e)
        }
    },
    watch: {
        "identity.current": {
            handler() {
                if (this.identity.current) {
                    this.generateQR()
                }
            },
            deep: true,
            immediate: true,
        },
    },
    data() {
        return {
            svg: "",
        }
    },
    async mounted() {
        
    },
    methods: {
        getQRstring(){
            let url = window.origin + "/?parent="
            const identity = new Identity()
            const identityString = identity.encode(this.identity.current)
            url += encodeURIComponent(identityString)
            return url
        },
        generateQR() {
            const canvas = document.getElementById("qr") as HTMLCanvasElement
            const qrString = this.getQRstring()
            // console.log("QR string:", qrString)
            
            this.svg = this.generateSVG(qrcode.create(qrString))     
            this.$nextTick(() => {
                gsap.fromTo("#qr-code-svg rect", {  color: "#fff", }, {color: "currentColor", duration: 0.5, stagger: {
                    each: 0.001,
                    from: "random",
                }, ease: "linear"})
                // gsap.fromTo("#qr-code-svg rect", { opacity: 0, color: "#ff9900"}, {opacity: 1,color: "currentColor", delay: .5, duration: 0.5, stagger: 0.001, ease: "elastic.out(1, 0.3)"})
            })
                 
        },
        generateSVG(qr) {

            const margin = 0; // marge rond QR code
            // grootte (aantal modules)
            const size = qr.modules.size;

            // bereken viewBox
            const dim = size + margin * 2;

            // start SVG
            let svg = '';
            svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges">\n`;
            svg += `<rect width="100%" height="100%" fill="#fff"/>\n`; // achtergrond

            // loop over modules
            for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {

                if (qr.modules.get(x, y)) {
                const px = x + margin;
                const py = y + margin;

                svg += `<rect x="${px}" y="${py}" width="1" height="1" fill="currentColor" />\n`;
                }

            }
            }

            // einde SVG
            svg += `</svg>\n`;
            return svg
        }
    },
})
</script>

<style>
.qr-code-container {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-flow: column;
    align-items: center;
    justify-content: center;
    gap: 64px;
    padding: 64px 0 32px;
}

#qr-code-svg {
    max-height: 25vh;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
        width: 100%;
        height: 100%;
    }
}

.qr-code-canvas-container {
    width: calc(100% - 128px);   
    min-width: 256px;
    max-width: 480px;
    text-decoration: none;
    display: flex;
    flex-flow: column;
    gap: 24px;

    canvas {
        width: 100%;
    }
}

.qr-code-canvas-title {
    text-wrap: balance;
    width: calc(100% + 32px);
    margin-left: -16px;
    font-size: 24px;
    font-family: var(--default-font);
    font-weight: 400;
    text-align: center;
}

.page-go-back {
    top: 16px;
    right: 16px;
    z-index: 199;
    font-size: 16px;
    display: flex;
    flex-flow: row;
    gap: 8px;
    text-decoration: none;
    font-family: var(--accent-font);
    line-height: 1;
    align-items: center;
    color: var(--contrast-color);

    &:visited {
        color: var(--contrast-color)
    }

    &:active {
        color: var(--accent-color)
    }

    svg {
        width: 23px;
        .jao-icon-cell[v="1"] {
            fill: currentColor !important;
        }
    }
}


.descriptive-note {
    font-family: var(--accent-font);
    font-size: 14px;
    text-align: center;
}

.qr-code-scanner-icon {
    max-width: 180px;
    text-decoration: none;
    text-align: center;
    display: flex;
    flex-flow: column;
    align-items: center;
    gap: 16px;
    color: var(--contrast-color);

    svg {
        max-width: clamp(64px,20vw, 10vh);
    }
}

</style>
