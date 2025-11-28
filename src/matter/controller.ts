import Matter from "matter-js"
import { MatterSetup } from "./setup"

import { Wall } from "./create/wall"
import { Ball } from "./create/ball"
import { Catterpillar } from "./create/catterpillar"
import CatterpillarModel from "@/models/catterpillar"


export class MatterController {
    ref: MatterSetup
    clickEvents: Array<Function> = []
    resizeEvents: Array<Function> = []
    catterpillar: CatterpillarModel

    constructor(target: HTMLElement) {
        this.ref = new MatterSetup(target, {
            devMode: true
        })
        

        this.#createWalls()



        this.catterpillar = new Catterpillar({ x: window.innerWidth / 2, y: window.innerHeight - 200, identity: { id: 1, name: "Catterpillar1", textureId: 1, colorSchemeId: 1, offset: 0 }}, this.ref.world).ref 

        // // Test function for making catterpillar walk
        // this.ref.addClickEvent(({x,y}) => {
        //     const cp = this.catterpillar;

        //     if (cp.x < x) {
        //         cp.moveRight()
        //     } else {
        //         cp.moveLeft()
        //     }
        // }, "moveCatterpillar");

        // Test function for contracting spine on click
        this.catterpillar.head.body.render.fillStyle = "#00ff00" 
        this.catterpillar.butt.body.render.fillStyle = "brown"
        this.ref.addClickEvent(({ x,y }) => {
            this.catterpillar.move("left")
        }, "moveCatterpillar")


        // this.ref.addClickEvent(({x,y}) => {
        //     console.log("createCatterpillar")
        //     new Catterpillar({ x: x, y: y, identity: { id: 1, name: "Catterpillar1", textureId: 1, colorSchemeId: 1, offset: 0} }, this.ref.world).ref 
        // }, "createCatterpillar");

        window.addEventListener("resize", this.#onResize.bind(this))

        this.ref.addResizeEvent(this.#resizeCanvas.bind(this), "resizeCanvas")
        this.ref.addResizeEvent(this.#updateWalls.bind(this), "updateWalls")
    }

    #onResize() {
        this.resizeEvents.forEach(fn => {
            fn()
        })
    }

    #resizeCanvas() {
        this.ref.renderer.options.width = this.ref.renderer.element.parentElement.clientWidth
        this.ref.renderer.options.height = this.ref.renderer.element.parentElement.clientHeight
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
            width: width,
            height: wallThickness,
            id: "top"
        }, this.ref.world)

        // Bottom
        new Wall({
            x: width / 2,
            y: height + wallThickness / 2 - 100,
            width: width,
            height: wallThickness,
            id: "bottom"
        }, this.ref.world)

        // Right wall
        new Wall({
            x: width + wallThickness / 2,
            y: height / 2,
            width: wallThickness,
            height: height,
            id: "right"
        }, this.ref.world)

        // Left wall
        new Wall({
            x: -wallThickness / 2,
            y: height / 2,
            width: wallThickness,
            height: height,
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


    // document.body.addEventListener("mousedown", PhysicsService.mouseDownEvent);
    // document.body.addEventListener("touchstart", PhysicsService.mouseDownEvent);
   
}