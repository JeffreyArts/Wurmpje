<template>
    <div class="dead-wurmpje-container">

        <router-link to="/scan" class="dead-wurmpje-header" v-if="identity">
            <jao-icon name="camera" size="large" active-color="currentColor" inactive-color="transparent" />
            <span>Go look for another wurmpje to take care for</span>
        </router-link>
        

        <div class="dead-wurmpje-center">
            <svg class="dead-wurmpje-title" ref="titleSvg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 520 290">
                <defs>
                    <path id="line1" d="M1,291.5S28.2,116.5,259,116.5s261,173.5,261,173.5" />
                    <path id="line2" d="M1,225.1S28.2,50.1,259,50.1s261,173.5,261,173.5" />
                </defs>
                <text>
                    <textPath text-anchor="middle" startOffset="50%" xlink:href="#line2" id="namePart1">
                        <tspan>
                            <tspan x="0" y="0">{{nameP1}}</tspan>
                        </tspan>
                    </textPath>
                </text>
                <text>
                    <textPath text-anchor="middle" startOffset="50%" xlink:href="#line1" id="namePart2">
                        <tspan>
                            <tspan x="0" y="0">{{nameP2}}</tspan>
                        </tspan>
                    </textPath>
                </text>
            </svg>

            <jao-icon class="dead-wurmpje-skull" ref="skull" name="skull" size="large" active-color="currentColor" inactive-color="transparent" />

            <div class="dead-wurmpje-age">
                <h2 class="dead-wurmpje-age-days" ref="age-days">1 day old</h2>
                <span class="dead-wurmpje-age-date" ref="age-date">03-01-2026</span>
            </div>
        </div>

        <footer class="dead-wurmpje-footer">
            <wurmpjeThumbnail type="flat" class="wurmpje" :identityField="identity" :draw-bg="false" @ready="parseThumbnail($event)" ref="portrait" />
            <p ref="deathText">{{memorialText}}</p>
        </footer>


    </div>
</template>



<script lang="ts">
import {defineComponent, type PropType} from "vue"
import jaoIcon from "./jao-icon.vue"
import SplitText from "gsap/SplitText"
import { gsap } from "gsap"
import { type currentIdentity} from "@/stores/identity"
import WurmpjeThumbnail from "@/components/wurmpje-thumbnail.vue";
import { type DBIdentity } from "@/stores/identity";
import type { MatterController } from "@/tamagotchi/controller";

export default defineComponent ({ 
    props: {
        identity: {
            type: Object as PropType<currentIdentity>,
            required: true
        },
        animate: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    components: {
        jaoIcon,
        WurmpjeThumbnail
    },
    data() {
        return {
        }
    },
    setup() {
    },
    computed: {
        nameP1(): string {
            let name = ""
            if (this.identity?.name.length > 16) {
                // Split the name into two parts
                const firstHalf = Math.ceil(this.identity.name.length / 2)
                const parts = this.identity.name.split(" ")
                let iLength = 0
                for (let i = 0; i < parts.length; i++) {
                    iLength += parts[i].length
                    if (iLength < firstHalf) {
                        name += `${parts[i]} `
                    }
                }
            }
            return name
        },
        nameP2(): string {
            return this.identity?.name.replace(this.nameP1, "") || ""
        },
        memorialText(): string {
            return ""
        }
    },
    async mounted() {
        gsap.registerPlugin(SplitText)

        if (!this.animate) {
            return;
        }

        gsap.set(".dead-wurmpje-center,.dead-wurmpje-footer", { opacity: 0 })
        setTimeout(() =>
            this.fadeIn()
        , 1000)
    },
    methods: {
       parseThumbnail(controller: MatterController) {
            controller.catterpillar.autoBlink = false
            controller.ref.removepointerDownEvent("grabCatterpillar")
            controller.ref.removepointerUpEvent("releaseCatterpillar")
            controller.ref.removepointerMoveEvent("dragCatterpillar")
        },
        fadeIn() {
            const skullRef = this.$refs.skull as typeof jaoIcon 
            const portraitRef = this.$refs.portrait as typeof WurmpjeThumbnail 
            const skull = skullRef.$el
            const portrait = portraitRef.$el
            const titleSvg = this.$refs.titleSvg as SVGSVGElement;
            const namePart1 = titleSvg.querySelector("#namePart1") as SVGTextElement;
            const namePart2 = titleSvg.querySelector("#namePart2") as SVGTextElement
            const ageDays = this.$refs["age-days"] as HTMLElement;
            const ageDate = this.$refs["age-date"] as HTMLElement;
            const deathText = this.$refs.deathText as HTMLElement;
            const deathTextSplit = SplitText.create(deathText, {type:"chars"});

            const skullDelay = 1.5
            // Animate skull
            gsap.fromTo(skull, 
                {scale: 0, x: "-50%", y: "-50%"}, 
                {scale: 1, x: "-50%", y: "-50%", delay: skullDelay, duration: 4, ease: "elastic.out(1.3, 0.2)"}
            )
            gsap.fromTo(skull, 
                {opacity: 0}, 
                {opacity: 1, delay: skullDelay + .64, duration: 2, ease: "linear"}
            )

            // Animate title
            gsap.fromTo(titleSvg, 
                {rotate: -15,transformOrigin: "256px 256px"}, 
                {rotate: 0, transformOrigin: "256px 256px", duration: 2, ease: "power3.out" }
            )

            gsap.fromTo(namePart1, 
                { attr: { startOffset: "20%" } }, 
                { attr: { startOffset: "50%" }, duration: 1.6, ease: "power3.out" }
            )
            gsap.fromTo(namePart2, 
                { attr: { startOffset: "70%" } }, 
                { attr: { startOffset: "50%" }, delay: 0.5, duration: 1.6, ease: "power3.out" }
            )

            gsap.fromTo(namePart1, 
                {opacity: 0 }, 
                {opacity: 1, duration: 1, ease: "linear" }
            )
            gsap.fromTo(namePart2, 
                {opacity: 0 }, 
                {opacity: 1, delay: 0.5, duration: 1, ease: "linear" }
            )

            // Animate age
            gsap.fromTo(ageDays, 
                {y: 20, opacity: 0, stagger: 1}, 
                {y: 0, opacity: 1, delay:1, duration: 1.5, ease: "power3.out" }
            )
            gsap.fromTo(ageDate, 
                {y: 20, opacity: 0, stagger: 1}, 
                {y: 0, opacity: 1, delay:1.08, duration: 1.5, ease: "power3.out" }
            )

            // Animate portrait
            gsap.fromTo(portrait, 
                { opacity: 0}, 
                { opacity: 1, delay: skullDelay + 2, duration: 2, ease: "linear" }
            )

            // Animate overlijdenstekst
            // delay: skullDelay + 3.5,
            gsap.fromTo(deathTextSplit.chars, 
                { rotate: 8, scale: .8}, 
                { rotate: 0, scale: 1, stagger: 0.024, delay: skullDelay + 3.5, duration: .64, ease: "linear" }
            )
            gsap.fromTo(deathTextSplit.chars, 
                { opacity: 0, }, 
                { opacity: 1, stagger: 0.032, delay: skullDelay + 3.5, duration: .64, ease: "linear" }
            )

            gsap.set(".dead-wurmpje-center,.dead-wurmpje-footer", { opacity: 1 })
        }
    }
})
</script>


<style> 
.dead-wurmpje-container {
    inset: 0;
    position: fixed;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;
    flex-direction: column;
    background-color: rgba(0,0,0,.8);
    color: var(--primary-bg-color);
}

.dead-wurmpje-title {
    fill: currentColor;
    width: 80%;
    margin-left: 10%;
    text-align: center;
    font-family: var(--accent-font);
    font-size: 64px;
    position: absolute;
    top: 20%;
    translate: 0 -50%;
    transform-origin: 256px 256px;
}

.dead-wurmpje-center {
    position: relative;
    width: 100%;
    max-width: 640px;
    aspect-ratio: 1;
    translate: 0 10%;
}

.dead-wurmpje-skull {
    /* opacity: 0; */
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: 50%;
}

.dead-wurmpje-age {
    position: absolute;
    bottom: calc(12.5% - 24px);
    left: 50%;
    translate: -50% 0; 
    text-align: center;
}


.dead-wurmpje-age-days {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
}

.dead-wurmpje-age-date {
    display: inline-block;
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: normal;
    opacity: 0.64;
}


.dead-wurmpje-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: normal;
    font-size: 12px;
    font-family: var(--accent-font);
    position: absolute;
    left: 16px;
    top: 8px;
    width: 112px;
    text-align: center;
    text-decoration: none;

    svg {
        width: 63px;
    }
}

.dead-wurmpje-footer {
    position: relative;
    width: 100%;
    max-width: 640px;
    padding: 0 32px;
    display: flex;
    flex-flow: column;
    justify-content: center;
    gap: 8px;
    text-align: center;
    font-family: var(--accent-font);
    font-size: 14px;
    p > span {
        transform-origin: center;
    }
}
</style>