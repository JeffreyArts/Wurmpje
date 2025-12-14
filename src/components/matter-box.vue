<template>
  
  <div id="catterpillar-container">
    <header v-if="identity && identity.name" class="catterpillar-header">
        <h1 class="catterpillar-name">{{ identity.name }}</h1>
        <span class="catterpillar-age">{{ age }}</span>
    </header>

    <section id="catterpillar" ref="catterpillar"></section>

    <footer class="buttons-container">
        <!-- <button class="button" @click="toggleClickTo('createCatterpillar')" :class="[{'__isSelected': clickType === 'createCatterpillar'}]">
            Create Catterpillar
        </button> -->

        <button class="button" id="devmode" @click="toggleDevMode()" :class="[{'__isSelected': dev, '__isDisabled': !dev}]">
            Dev Mode
        </button>
    </footer>

  </div>
</template>



<script lang="ts">
import {defineComponent} from "vue"
import { MatterController } from "@/tamagotchi/controller"
import useIdentityStore from "@/stores/identity"
import { gsap } from "gsap"
import _ from "lodash"
import type Catterpillar from "@/models/catterpillar"
    
export default defineComponent ({ 
    props: [],
    data() {
        return {
            controller: null as MatterController | null,
            clickType: null as string | null,
            dev: false
        }
    },
    setup() {
        const identityStore = useIdentityStore()
        return {
            identity: identityStore
        }
    },
    watch: {
        
    },
    computed: {
        age(): string {
            if (!this.identity.age) {
                return "-"
            }
            if (this.identity.age == 1) {
                return "1 day old"
            }
            if (this.identity.age > 2) {
                return `${this.identity.age} days`
            }
        }
    },
    async mounted() {
        
        try {
            await this.identity.initialised
        } catch (e) {
            return console.error("Failed to initialise identity store:", e)
        }
        
        this.controller = new MatterController(
            this.$refs["catterpillar"] as HTMLElement,
            {
                identity: this.identity.origin,
                length: 8,
                thickness: 30
            }
        )
        
        this.toggleDevMode()
        this.toggleDevMode()

        this.toggleClickTo("moveCatterpillar")
    },
    methods: {
        toggleClickTo(type: string) {
            this.clickType = type
            this.controller.switchClickEvent(type)
        },
        toggleDevMode() {
            this.dev = !this.dev
            const twoEl = this.$el.querySelector("[id^='two-js']") as HTMLCanvasElement
            const rendererEl = this.$el.querySelector("#matter") as HTMLCanvasElement
            gsap.to(twoEl, {duration: 0.3, opacity: this.dev ? 0 : 1})
            gsap.to(rendererEl, {duration: 0.3, opacity: this.dev ? 1 : 0})
            // if (this.controller) {
            //     this.controller.ref.renderer.options.showCollisions = this.dev
            //     this.controller.catterpillar.composite.constraints.forEach(constraint => {
            //         constraint.render.visible = this.dev
            //     })
            //     this.controller.ref.world.composites.forEach(composite => {
            //         if (composite.label.startsWith("catterpillar")) {
            //             composite.constraints.forEach(constraint => {
            //                 constraint.render.visible = this.dev
            //             })   
            //         }
            //     })
            // }
        },
        increaseLength(amount: number) {
            if (this.controller) {
                this.controller.catterpillar.remove()
                this.controller.catterpillar.length += amount
                this.controller.catterpillar = this.controller.createCatterpillar(
                    { x: this.controller.catterpillar.head.body.position.x, y: this.controller.catterpillar.head.body.position.y },
                    {
                        length: this.controller.catterpillar.length,
                        thickness: this.controller.catterpillar.thickness
                    }
                )
                this.controller.draw.objects = []
                if (this.controller.catterpillar) {
                    this.controller.draw.addCatterpillar(this.controller.catterpillar as Catterpillar)
                }
            }
        },
    }
})
</script>


<style> 

#catterpillar-container {
    position: relative;
    width: 100%;

    > div {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
    }
}

.catterpillar-header {
    position: absolute;
    top: 0;
    left: 50%;
    translate: -50% 0;
    max-width: 320px;
    text-align: center;
    padding-top: 16px;
}

.catterpillar-name {
    font-size: 24px;
    font-family: var(--accent-font);
    line-height: 24px;
    margin: 0;
}

.catterpillar-age {
    font-size: 16px;
    font-family: var(--accent-font);
    opacity: 0.4;
}

.button {
    color: #eee;
    background-color: var(--primary-bg-color);
    border: 0 none transparent;
    padding: 8px 16px;
    transition: .16s all ease;
    color: var(--contrast-color);

    &:hover {
        filter: brightness(95%);
        cursor: pointer;
        border-radius: 8px;
    }

    &.dark {
        background-color: var(--contrast-color);
        color: var(--primary-bg-color);
        border: 1px solid var(--contrast-color);
        &:hover, &:focus {
            background-color: var(--primary-bg-color);
            color: var(--contrast-color);
            cursor: pointer;
            border-radius: 2px;
        }
    }
    
    &.default {
        background-color: #eee;
        color: #222;
        &:hover, &:focus {
            box-shadow: 8px 8px 0 rgba(0,0,0,1);
            cursor: pointer;
            border-radius: 2px;
        }
    }
    
    &.__isSmall {
        padding: 4px 8px;
        font-size: 12px;
    }

    &.__isDisabled {
        background-color: var(--red);
        cursor: not-allowed;
        color: var(--primary-bg-color);
    }

    &.__isSelected {
        background-color: var(--green);
        color: var(--primary-bg-color);
    }
}

.buttons-container {
    display: flex;
    gap: 8px;
    position: fixed;
    flex-flow: wrap row;
    bottom: 16px;
    left: 16px;
}

#devmode {
    position: fixed;
    bottom: 16px;
    right: 16px;
}
</style>