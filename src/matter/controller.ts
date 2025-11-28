import Matter from "matter-js"
import { MatterSetup } from "./setup"

import { Wall } from "./create/wall"
import { Ball } from "./create/ball"
import { Catterpillar } from "./create/catterpillar"
import CatterpillarModel from "@/models/catterpillar"


export class MatterController {
    ref: MatterSetup;
    clickEvents: Array<Function> = [];
    resizeEvents: Array<Function> = [];
    catterpillar: CatterpillarModel

    constructor(target: HTMLElement) {
        this.ref = new MatterSetup(target, {
            devMode: true
        })
        

        this.#createWalls();



        this.catterpillar = new Catterpillar({ x: 100, y: 100, identity: { id: 1, name: "Catterpillar1", textureId: 1, colorSchemeId: 1, offset: 0} }, this.ref.world).ref 

        // Test function for adding balls on click
        this.ref.addClickEvent(({x,y}) => {
            const cp = this.catterpillar;

            if (cp.x < x) {
                cp.moveRight()
            } else {
                cp.moveLeft()
            }
        }, "addBallOnClick")

        window.addEventListener("resize", this.#onResize.bind(this));
        this.addResizeEvent(this.#resizeCanvas.bind(this));
        this.addResizeEvent(this.#updateWalls.bind(this));
    }

    #onResize() {
        this.resizeEvents.forEach(fn => {
            fn();
        });
    }

    #resizeCanvas() {
        this.ref.renderer.options.width = this.ref.renderer.element.parentElement.clientWidth;
        this.ref.renderer.options.height = this.ref.renderer.element.parentElement.clientHeight;
        Matter.Render.setPixelRatio(this.ref.renderer, window.devicePixelRatio);
    }

    #createWalls() {
        const width = this.ref.renderer.options.width;
        const height = this.ref.renderer.options.height;
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
            y: height + wallThickness / 2,
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
        const width = this.ref.renderer.options.width;
        const height = this.ref.renderer.options.height;
        const wallThickness = 100

        // Get Walls
        const walls = Matter.Composite.allBodies(this.ref.world).forEach(body => {
            const labels = body.label.split(",");
            if (labels.includes("wall")) {
                Matter.Composite.remove(this.ref.world, body);
            }
        });

        this.#createWalls();

        // walls.forEach(body => {
        //     const labels = body.label.split(",");
        //     if (labels.includes("top")) {
        //         Matter.Body.setPosition(body, { x: width / 2, y: 0 - wallThickness / 2 });
        //     } else if (labels.includes("bottom")) {
        //         Matter.Body.setPosition(body, { x: width / 2, y: height });
        //     } else if (labels.includes("right")) {
        //         Matter.Body.setPosition(body, { x: width + wallThickness / 2, y: height / 2 });
        //     } else if (labels.includes("left")) {
        //         Matter.Body.setPosition(body, { x: -wallThickness / 2, y: height / 2 });
        //     }
        // });
        

        // // Update positions of walls
        // Matter.Body.setPosition(this.walls.top.body, { x: width / 2, y: 0 - wallThickness / 2 });
        // Matter.Body.setPosition(this.walls.bottom.body, { x: width / 2, y: height + wallThickness / 2 });
        // Matter.Body.setPosition(this.walls.right.body, { x: width + wallThickness / 2, y: height / 2 });
        // Matter.Body.setPosition(this.walls.left.body, { x: -wallThickness / 2, y: height / 2 });
    }

    addResizeEvent(fn: Function) {
        this.resizeEvents.push(fn);
    }
}