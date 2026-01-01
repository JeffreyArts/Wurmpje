<template>
    <section class="healthbar">
        <div class="bar" :style="`width: ${percentage}%`"></div>
    </section>
</template>



<script lang="ts">
import {defineComponent, type PropType} from "vue"
import { MatterController } from "@/tamagotchi/controller"
import { type currentIdentity } from "@/stores/identity"
    
export default defineComponent ({ 
    props: {
        min: {
            type: Number,
            required: false
        },
        max: {
            type: Number,
            required: false
        },
        value: {
            type: Number,
            required: true 
        }
    },
    computed: {
        percentage(): number {
            const min = this.min ?? 0
            const max = this.max ?? 100

            if (this.value <= min) {
                return 0
            }

            if (this.value >= max) {
                return 100
            }

            return ((this.value - min) / (max - min)) * 100
        }
    }
})
</script>


<style> 

.healthbar {
    width: 100%;
    height: 16px;
    background-color: #ccc;
    overflow: hidden;
    mask-image: linear-gradient(90deg, transparent 2px, black 4px);
    mask-repeat: repeat-x;
    mask-size: 6px;

    .bar {
        height: 100%;
        background-color: currentColor;
        transition: width 0.3s linear;
    }
}

</style>