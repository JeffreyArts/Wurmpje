import Matter from "matter-js"
import paper from "paper"
import { MatterSetup } from "./setup"
import { Draw } from "./draw"

import { Wall } from "./create/wall"
import { Ball } from "./create/ball"
import { Catterpillar } from "./create/catterpillar"
import CatterpillarModel from "@/models/catterpillar"
import type { IdentityField } from "@/models/identity"

import ColorSchemes from "@/assets/default-color-schemes"
import Textures from "@/assets/default-textures"


export class MatterController {
    ref: MatterSetup
    clickEvents: Array<Function> = []
    resizeEvents: Array<Function> = []
    catterpillar: CatterpillarModel
    mousePin: Matter.Constraint = null
    draw: Draw
    identity: IdentityField = {
        id: 1,
        name: "Catterpillar",
        textureIndex: 1,
        colorSchemeIndex: 1,
        offset: 0
    }

    constructor(target: HTMLElement, identity?: IdentityField ) {
        this.ref = new MatterSetup(target, {
            devMode: true
        })
    
        this.draw = new Draw(this.ref.paper)
        this.identity = identity

        
        this.#createWalls()
        
        
        this.createCatterpillar({ x: this.ref.renderer.options.width / 2, y: this.ref.renderer.options.height - 200 }, this.identity )
        
        this.draw.addCatterpillar(this.catterpillar)

        window.addEventListener("resize", this.#onResize.bind(this))

        
        this.ref.addpointerDownEvent(this.#grabCatterpillar.bind(this), "grabCatterpillar")
        this.ref.addpointerUpEvent(this.#releaseCatterpillar.bind(this), "releaseCatterpillar")
        this.ref.addpointerMoveEvent(this.#dragCatterpillar.bind(this), "dragCatterpillar")
        this.ref.addResizeEvent(this.#resizeCanvas.bind(this), "resizeCanvas")
        this.ref.addResizeEvent(this.#updateWalls.bind(this), "updateWalls")
        
        requestAnimationFrame(this.#loop.bind(this))
    }
    #loop() {
        if (this.catterpillar.x < 0 || this.catterpillar.x > this.ref.renderer.options.width  ||
            this.catterpillar.y < 0 || this.catterpillar.y > this.ref.renderer.options.height ) {
            // Re-center Catterpillar
            this.catterpillar.remove()
            this.createCatterpillar({ x: this.ref.renderer.options.width / 2, y: this.ref.renderer.options.height - 200 })  
         
        }

        requestAnimationFrame(this.#loop.bind(this))
    }

    #onResize() {
        this.resizeEvents.forEach(fn => {
            fn()
        })
    }

    #resizeCanvas() {
        this.ref.renderer.options.width = this.ref.renderer.element.parentElement.clientWidth
        this.ref.renderer.options.height = this.ref.renderer.element.parentElement.clientHeight

        this.ref.paper.view.viewSize.width = this.ref.renderer.options.width
        this.ref.paper.view.viewSize.height = this.ref.renderer.options.height
        Matter.Render.setPixelRatio(this.ref.renderer, window.devicePixelRatio)
    }

    #createWalls() {
        const width = this.ref.renderer.options.width
        const height = this.ref.renderer.options.height
        const wallThickness = 100

        // Top wall
        new Wall({
            x: width / 2,
            y: 0 - wallThickness / 2,
            width: width * 2,
            height: wallThickness,
            id: "top"
        }, this.ref.world)

        // Bottom
        new Wall({
            x: width / 2,
            y: height + wallThickness / 2 - 50,
            width: width * 2,
            height: wallThickness,
            id: "bottom"
        }, this.ref.world)

        // Right wall
        new Wall({
            x: width + wallThickness / 2,
            y: height / 2,
            width: wallThickness,
            height: height * 2,
            id: "right"
        }, this.ref.world)

        // Left wall
        new Wall({
            x: -wallThickness / 2,
            y: height / 2,
            width: wallThickness,
            height: height * 2,
            id: "left"
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

    #grabCatterpillar({ x, y }: { x: number, y: number }) {
        // Check if x & y Match a body part
        this.catterpillar.bodyParts.forEach(bodyPart => {
            const bounds = bodyPart.body.bounds
            if (x >= bounds.min.x && x <= bounds.max.x && y >= bounds.min.y && y <= bounds.max.y) {
                // Create constraint and attach to body part
                this.mousePin = this.catterpillar.pin(bodyPart, { x, y  })
            }
        })
    }

    #releaseCatterpillar() {
        if (this.mousePin) {
            this.catterpillar.unpin(this.mousePin)
            this.mousePin = null
        }
    }

    #dragCatterpillar(mouse: { x: number, y: number }) {
        let x = mouse.x
        let y = mouse.y
        
        if (mouse.x < 0) {
            x = 0
        }
        if (mouse.x > this.ref.renderer.options.width) {
            x = this.ref.renderer.options.width
        }

        if (mouse.y < 0) {
            y = 0
        }
        if (mouse.y > this.ref.renderer.options.height) {
            y = this.ref.renderer.options.height
        }
        if (this.mousePin) {
            this.mousePin.pointB = { x, y } 
        }
    }

    switchClickEvent(name: string) {
        this.ref.clickEvents = []
        let fn

        if (name == "moveCatterpillar") {
            fn = () => {
                this.catterpillar.move()
            }
        } else if (name == "createCatterpillar") {
            fn = ({ x,y }) => {
                const id = this.ref.world.composites.filter(c => c.label.startsWith("catterpillar")).length + 1
                new Catterpillar({ x: x, y: y, identity: { id, name: `Catterpillar${id}`, textureIndex: 1, colorSchemeIndex: 1, offset: 0 }}, this.ref.world) 
            }
        } else if (name == "standUpCatterpillar") {
            fn = () => {
                this.catterpillar.standUp(0, .5)
                let a = 0
                const interval = setInterval(async () => {
                    if (a >= 5) {
                        clearInterval(interval)
                        this.catterpillar.releaseStance()
                        return
                    }

                    if (a % 2 === 0) {
                        this.catterpillar.standUp(90, .5)
                    } else {
                        this.catterpillar.standUp(-90, .5)
                    }

                    a++
                }, 800)
            }
        } else if (name == "turnAround") {
            fn = () => {
                this.catterpillar.turnAround()
            }
        }

        this.ref.addClickEvent(fn, name)
    }

    createCatterpillar(position: { x: number, y: number }, identity?: IdentityField) {
        

        if (!identity) {
            const id = this.ref.world.composites.filter(c => c.label.startsWith("catterpillar")).length + 1

            const colorSchemeIndex = Math.floor(ColorSchemes.length * Math.random())
            const textureIndex = Math.floor(Textures.length * Math.random())

            identity = {
                id,
                name: "catterpillar",
                textureIndex: textureIndex,
                colorSchemeIndex: colorSchemeIndex,
                offset: Math.floor(Math.random() * 16)
            }
        }

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
        
    }

    // document.body.addEventListener("mousedown", PhysicsService.mouseDownEvent);
    // document.body.addEventListener("touchstart", PhysicsService.mouseDownEvent);
   
}