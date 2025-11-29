<template>
  
  <div id="catterpillar-container">
    <div id="catterpillar" ref="catterpillar"></div>

    <footer class="buttons-container">
        <button class="button" @click="toggleClickTo('createCatterpillar')" :class="[{'__isSelected': clickType === 'createCatterpillar'}]">
            Create Catterpillar
        </button>
        <button class="button" @click="toggleClickTo('moveCatterpillar')" :class="[{'__isSelected': clickType === 'moveCatterpillar'}]">
            Move Catterpillar
        </button>
        <button class="button" @click="toggleClickTo('standUpCatterpillar')" :class="[{'__isSelected': clickType === 'standUpCatterpillar'}]">
            Stand-up Catterpillar
        </button>
        <button class="button" @click="toggleClickTo('turnAround')" :class="[{'__isSelected': clickType === 'turnAround'}]">
            Turn around
        </button>


        <button class="button" id="devmode" @click="toggleDevMode()" :class="[{'__isSelected': dev, '__isDisabled': !dev}]">
            Dev Mode
        </button>
        
    </footer>
  </div>
</template>



<script lang="ts">
import {defineComponent} from "vue"
import { MatterController } from "@/tamagotchi/controller"
import { gsap } from "gsap"
import _ from "lodash"
    
export default defineComponent ({ 
    props: [],
    data() {
        return {
            controller: null as MatterController | null,
            clickType: null as string | null,
            dev: false
        }
    },
    watch: {
        
    },
    mounted() {
        this.controller = new MatterController(
            this.$refs["catterpillar"] as HTMLElement
        )
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
            const paperEl = this.$el.querySelector("[id^='paper-view']") as HTMLCanvasElement
            const rendererEl = document.getElementById("matter") as HTMLCanvasElement
            gsap.to(paperEl, {duration: 0.3, opacity: this.dev ? 0 : 1})
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
        }
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
    top: 16px;
    right: 16px;
}
</style>