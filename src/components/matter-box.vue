<template>
  
  <div id="catterpillar-container">
    <div id="matter-js" ref="matterContainer"></div>
    <div id="paper-js" ref="paperContainer"></div>

    <footer class="buttons-container">
        <button class="button" @click="toggleClickTo('createCatterpillar')" :class="[{'__isSelected': clickType === 'createCatterpillar'}]">
            Create Catterpillar
        </button>
        <button class="button" @click="toggleClickTo('moveCatterpillar')" :class="[{'__isSelected': clickType === 'moveCatterpillar'}]">
            Move Catterpillar
        </button>
        
    </footer>
  </div>
</template>



<script lang="ts">
import {defineComponent} from "vue"
import { MatterController } from "@/matter/controller"
import { Ball } from "@/matter/create/ball"
import Matter from "matter-js"
import _ from "lodash"
import { Wall } from "@/matter/create/wall"
    
export default defineComponent ({ 
    props: [],
    data() {
        return {
            controller: null as MatterController | null,
            rightWall: null as Wall | null,
            clickType: null as string | null,
        }
    },
    watch: {
        
    },
    mounted() {
        this.controller = new MatterController(
            this.$refs["matterContainer"] as HTMLElement
        )
        
        window.addEventListener("resize", this.updateView)
    },
    unmounted() {
        window.removeEventListener("resize", this.updateView)
    },
    methods: {
        updateView() {
            const matterContainer = this.$refs["matterContainer"] as HTMLElement
            const paperContainer = this.$refs["paperContainer"] as HTMLElement
            if (!paperContainer) {
                throw new Error("paperContainer ref can not be found")
            }
            if (!matterContainer) {
                throw new Error("matterContainer ref can not be found")
            }
        },
        render() {
        },
        toggleClickTo(type: string) {
            this.clickType = type
            this.controller.switchClickEvent(type)
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
        background-color: #ccc;
        cursor: not-allowed;
    }

    &.__isSelected {
        background-color: var(--green);
        cursor: not-allowed;
        color: var(--primary-bg-color);
    }
}

.buttons-container {
    position: fixed;
    bottom: 16px;
    left: 16px;
}
</style>