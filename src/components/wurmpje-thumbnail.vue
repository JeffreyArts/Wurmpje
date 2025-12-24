<template>
    <section class="wurmpje-thumbnail" :class="{'__isCurved': type === 'curved'}">
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
        },
        type: {
            type: String as PropType<"flat" | "curved">,
            required: false,
            default: "curved"
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
                    this.$nextTick().then(() => {
                        if (this.type === "flat") {
                            this.createFlatCanvas(this.$el.clientWidth, this.$el.querySelector("#canvas-container"), val);
                        } else {
                            this.createCurvedCanvas(this.$el.clientWidth, this.$el.clientHeight, this.$el.querySelector("#canvas-container"), val);
                        }
                    })
                }
            },
            immediate: true
        }
    },
    methods: {
        createFlatCanvas(width: number, target: HTMLElement, identity: IdentityField) {
            
            const thickness = identity.thickness;
            const el = this.$el as HTMLElement
            el.style.height = `${thickness * 5}px`;

            if (identity.length >= width/thickness) {
                identity.length = Math.floor(width/thickness)-1;
            }

            let blockSize = 8;
            if (width < 128) {
                blockSize = 4;
            }
            this.controller = new MatterController( target, {
                identity: identity,
                catterpillarPos: { x: width/2 + thickness/2, y: identity.thickness * 2},
                offsetBottom: (thickness*5)/2 - thickness/2
            })
            this.controller.ref.removepointerMoveEvent("lookAtMouse")
            this.controller.draw.drawBG({blockSize})
            this.controller.catterpillar.rightEye.lookLeft(2)
            this.controller.catterpillar.leftEye.lookLeft(2)
            
            const canvas = target.querySelector("#two-js") as HTMLCanvasElement;

            this.$emit("ready", this.controller)
        },
        createCurvedCanvas(width: number, height: number, target: HTMLElement, identity: IdentityField) {
            const scale = 1;
            const length = identity.length * scale;
            const thickness = identity.thickness * scale;
            let blockSize = 8;
            if (width < 128) {
                blockSize = 4;
            }
            this.controller = new MatterController( target, {
                identity: identity,
                catterpillarPos: { x: width/2 + (length * thickness) * .16, y: height - thickness * 1.5},
                offsetBottom: thickness * 1.5
            })
            this.controller.ref.removepointerMoveEvent("lookAtMouse")
            this.controller.draw.drawBG({blockSize})
            setTimeout(() => this.controller.catterpillar.contractSpine(0.75, .4), 10)

            const canvas = target.querySelector("#two-js") as HTMLCanvasElement;
            this.$emit("ready", this.controller)
        },
    }
})
</script>


<style> 

.wurmpje-thumbnail {
    width: 100%;
    margin: 0;
    
    &.__isCurved {
        aspect-ratio: 1 / 1;
    }
    
    #canvas-container {
        width: 100%;
        margin: 0;
        padding: 0;
        position: relative;
        height: 100%;
        
        #matter {
            display: none;
        }
    }
}

</style>