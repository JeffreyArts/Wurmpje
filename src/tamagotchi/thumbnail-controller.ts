import Matter from "matter-js"
import { markRaw } from "vue"
import { MatterSetup } from "./setup"
import { Draw } from "./draw"

import { Wall } from "./create/wall"
import { Catterpillar } from "./create/catterpillar"
import CatterpillarModel from "@/models/catterpillar"
import type { IdentityField } from "@/models/identity"

export class ThumbnailController {
    ref: MatterSetup
    catterpillar: CatterpillarModel
    draw: Draw
    config: {
        offsetBottom?: number
    } = {}
    identity: IdentityField = {
        id: 1,
        name: "Catterpillar",
        textureIndex: 1,
        colorSchemeIndex: 1,
        offset: 0,
        gender: 0,
        thickness: 16,
        length: 8
    }

    constructor(target: HTMLElement, options?: {
        identity?: IdentityField,
        offsetBottom?: number,
        catterpillarPos?: { x: number, y: number }
    } ) {

        const catterpillarOptions = {} as { identity: IdentityField }

        if (!options) {
            options = {}
        }
        const { identity, offsetBottom } = options
        if (identity) {
            this.identity = identity
        }
        catterpillarOptions.identity = identity
        
        this.ref = new MatterSetup(target, {
            devMode: true
        })
        
        if (offsetBottom) {
            this.config.offsetBottom = offsetBottom
        } else {
            this.config.offsetBottom = 0
        }
        
        
        this.draw = markRaw(new Draw(this.ref.two))
        
        let startPosition = { x: this.ref.renderer.options.width / 2, y: this.ref.renderer.options.height - 200 }
        if (options?.catterpillarPos) {
            startPosition = options.catterpillarPos
        }
        
        
        this.createCatterpillar(startPosition, catterpillarOptions)
        this.#createWalls()
        this.ref.addResizeEvent(this.#resizeCanvas.bind(this), "resizeCanvas")
        this.ref.addResizeEvent(this.#updateWalls.bind(this), "updateWalls")
    }
    

    #resizeCanvas() {
        this.ref.renderer.options.width = this.ref.renderer.element.parentElement.clientWidth
        this.ref.renderer.options.height = this.ref.renderer.element.parentElement.clientHeight

        this.ref.two.width = this.ref.renderer.options.width
        this.ref.two.height = this.ref.renderer.options.height
        Matter.Render.setPixelRatio(this.ref.renderer, window.devicePixelRatio)
    }

    #createWalls() {
        const offsetBottom = this.config.offsetBottom 
        const width = this.ref.renderer.options.width
        const height = this.ref.renderer.options.height
        const wallThickness = 100

        // Top wall
        new Wall({
            x: width / 2,
            y: 0 - wallThickness / 2,
            width: width * 2,
            height: wallThickness,
            id: "top",
        }, this.ref.world)

        // Bottom
        new Wall({
            x: width / 2,
            y: height + wallThickness / 2 - offsetBottom,
            width: width * 2,
            height: wallThickness,
            id: "bottom",
        }, this.ref.world)

        // Right wall
        new Wall({
            x: width + wallThickness / 2,
            y: height / 2,
            width: wallThickness,
            height: height * 2,
            id: "right",
        }, this.ref.world)

        // Left wall
        new Wall({
            x: -wallThickness / 2,
            y: height / 2,
            width: wallThickness,
            height: height * 2,
            id: "left",
        }, this.ref.world)
    }

    #updateWalls() {
        // Get Walls
        Matter.Composite.allBodies(this.ref.world).forEach(body => {
            const labels = body.label.split(",")
            if (labels.includes("wall")) {
                Matter.Composite.remove(this.ref.world, body)
            }
        })

        this.#createWalls()
    }

    createCatterpillar(position: { x: number, y: number }, options?: { identity?: IdentityField }) {
        let { identity } = options || {}

        if (!identity) {
            const id = this.ref.world.composites.filter(c => c.label.startsWith("catterpillar")).length + 1

            identity = {
                id,
                name: "catterpillar",
                textureIndex: identity.textureIndex,
                colorSchemeIndex: identity.colorSchemeIndex,
                offset: Math.floor(Math.random() * 16),
                gender: Math.random() > 0.5 ? 1 : 0,
                thickness: 16,
                length: 6
            }
        }
        this.identity = identity

        this.catterpillar = new Catterpillar({
            x: position.x,
            y: position.y,
            identity: identity as IdentityField
        }, this.ref.world).ref

        // Custom colors for the main catterpillar
        this.catterpillar.bodyParts.forEach((part, index) => {
            if (index === 0) {
                part.body.render.fillStyle = "tomato"
            } else if (index === this.catterpillar.bodyParts.length - 1) {
                part.body.render.fillStyle = "brown"
            } else {
                part.body.render.fillStyle = `hsl(128, ${Math.random() * 10 + 90}%,  ${Math.random() * 10 + 45}%)`
            }
        })

        this.draw.addCatterpillar(this.catterpillar)
        return this.catterpillar
    }

    destroy = () => {
        this.ref.world.bodies.length = 0
        this.ref.world.composites.length = 0
        this.ref.world.constraints.length = 0
        
        Matter.Render.stop(this.ref.renderer)

        this.ref.renderer.canvas.remove()

        this.draw.two.clear()
        this.draw.two.remove()
        this.draw.two.renderer.domElement.remove()
    }   
   
}