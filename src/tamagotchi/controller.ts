import Matter from "matter-js"
import gsap from "gsap"
import { MatterSetup } from "./setup"
import { Draw } from "./draw"

import { Wall } from "./create/wall"
import { Catterpillar } from "./create/catterpillar"
import CatterpillarModel from "@/models/catterpillar"
import FoodModel from "@/models/food"
import type { IdentityField } from "@/models/identity"

import actionStore from "@/stores/action"
import storyStore from "@/stores/story"
import identityStore from "@/stores/identity"
type Listener = { type: string; fn: (...args: any[]) => void }

export class MatterController {
    private listeners: Listener[] = []
    identityStore = identityStore()
    actionStore = actionStore()
    storyStore = storyStore()
    ref: MatterSetup
    // resizeEvents: Array<Function> = []
    catterpillar: CatterpillarModel
    mousePin: Matter.Constraint = null
    draw: Draw
    config: {
        offsetBottom?: number
    } = {}
    cooldown: number = 0
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
        catterpillarPos?: { x: number, y: number }
        offsetBottom?: number
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
        
        this.draw = new Draw(this.ref.two)
        
        let startPosition = { x: this.ref.renderer.options.width / 2, y: this.ref.renderer.options.height - 200 }
        if (options?.catterpillarPos) {
            startPosition = options.catterpillarPos
        }
        
        
        this.createCatterpillar(startPosition, catterpillarOptions)
        this.#createWalls()
        this.#collisionEventListener()
        this.storyStore.initialised.then(() => {
            this.storyStore.setController(this)
            this.storyStore.setIdentity(this.identity)
            this.storyStore.setActiveStory("intro")
        })
        
        // this.ref.addpointerMoveEvent(this.#lookAtMouse.bind(this), "lookAtMouse")
        this.ref.addpointerDownEvent(this.#grabCatterpillar.bind(this), "grabCatterpillar")
        this.ref.addpointerUpEvent(this.#releaseCatterpillar.bind(this), "releaseCatterpillar")
        this.ref.addpointerMoveEvent(this.#dragCatterpillar.bind(this), "dragCatterpillar")
        this.ref.addResizeEvent(this.#resizeCanvas.bind(this), "resizeCanvas")
        this.ref.addResizeEvent(this.#updateWalls.bind(this), "updateWalls")
        
        requestAnimationFrame(this.#loop.bind(this))
    }
    #loop() {
        if (this.catterpillar.x < 0 || this.catterpillar.x > this.ref.renderer.options.width  ||
            this.catterpillar.y > this.ref.renderer.options.height ) {
            // Re-center Catterpillar
            this.catterpillar.remove()
            this.createCatterpillar({ x: this.ref.renderer.options.width / 2, y: this.ref.renderer.options.height - 200 }, { identity: this.identity })  
        }

        requestAnimationFrame(this.#loop.bind(this))
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

    #grabCatterpillar({ x, y }: { x: number, y: number }) {
        // Check if x & y Match a body part
        this.catterpillar.bodyParts.forEach(bodyPart => {
            const bounds = bodyPart.body.bounds
            if (x >= bounds.min.x && x <= bounds.max.x && y >= bounds.min.y && y <= bounds.max.y) {
                // Create constraint and attach to body part
                this.mousePin = this.catterpillar.pin(bodyPart, { x, y, name: "mousePin" })
            }
        })
    }

    #releaseCatterpillar() {
        this.catterpillar.pins.forEach(pin => {
            const labels = pin.label.split(",")

            if (labels.includes("mousePin")) {
                this.catterpillar.unpin(pin)
            }
        })
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

    #lookAtMouse(mouse: { x: number, y: number }) {
        
        if (this.catterpillar) {
            if (this.catterpillar.leftEye.isFollowing) {
                return
            }
            this.catterpillar.leftEye.lookAt({ x: mouse.x, y: mouse.y })
            this.catterpillar.rightEye.lookAt({ x: mouse.x, y: mouse.y })
        }
    }

    #collisionEventListener() {
        Matter.Events.on(this.ref.engine, "collisionStart", (event) => {
            event.pairs.forEach((pair) => {
                // Check of dit pair je head bevat
                const head = this.catterpillar.head.body
                if (pair.bodyA === head || pair.bodyB === head) {
                    // Bepaal welke body de head is en welke de ander
                    const other = (pair.bodyA === head) ? pair.bodyB : pair.bodyA
                    const normal = pair.collision.normal

                    // Relatieve snelheid langs normaal
                    const relVel = {
                        x: other.velocity.x - head.velocity.x,
                        y: other.velocity.y - head.velocity.y
                    }
                    const vRelAlongNormal = relVel.x * normal.x + relVel.y * normal.y

                    const impactScore = Math.abs(vRelAlongNormal)

                    if (impactScore > 24) {
                        this.actionStore.add(this.identity.id, "love", -2)
                        this.identityStore.current.love -= 2
                    }
                }
            })
        })

    }

    on(eventName: string, callback: (...args: any[]) => void) {
        this.listeners.push({ type: eventName, fn: callback })
    }

    // Event afvuren
    emit(eventName: string, ...args: any[]) {
        this.listeners
            .filter(listener => listener.type === eventName)
            .forEach(listener => listener.fn(...args))
    }

    // Event verwijderen (optioneel)
    off(eventName: string, callback?: (...args: any[]) => void) {
        this.listeners = this.listeners.filter(listener => {
            if (listener.type !== eventName) return true
            if (callback && listener.fn !== callback) return true
            return false
        })
    }

    switchClickEvent(name: string) {
        this.ref.clickEvents = []
        let fn

        if (name == "moveCatterpillar") {
            fn = ({ x, /* y */ }) => {
                if (this.catterpillar.isPointingLeft()) {
                    if (x < this.catterpillar.x) {
                        this.catterpillar.move()
                    } else {
                        this.catterpillar.turnAround()
                    }
                } else {
                    if (x > this.catterpillar.x) {
                        this.catterpillar.move()
                    } else {
                        this.catterpillar.turnAround()
                    }
                }
            }
        } else if (name == "createCatterpillar") {
            fn = ({ x,y }) => {
                const id = this.ref.world.composites.filter(c => c.label.startsWith("catterpillar")).length + 1
                new Catterpillar({
                    x: x,
                    y: y,
                    identity: { id, name: `Catterpillar${id}`, textureIndex: 1, colorSchemeIndex: 1, offset: 0, gender: 0, length: 14, thickness: 10 },
                }, this.ref.world) 
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

    destroy() {
        this.ref.world.bodies.length = 0
        this.ref.world.composites.length = 0
        this.ref.world.constraints.length = 0
        
        Matter.Render.stop(this.ref.renderer)

        this.ref.renderer.canvas.remove()
        this.listeners = []

        this.draw.two.clear()
        this.draw.two.remove()
        this.draw.two.renderer.domElement.remove()
    }
}