<template>
  
  <div id="catterpillar-container">
    <div id="matter-js" ref="matterContainer"></div>
    <div id="paper-js" ref="paperContainer"></div>
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
            rightWall: null as Wall | null
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
</style>