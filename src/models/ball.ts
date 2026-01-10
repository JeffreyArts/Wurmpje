import Matter from "matter-js"
import { collisionItem } from "@/tamagotchi/collisions"

export class Ball {
    composite: Matter.Composite
    world: Matter.World
    x: number
    y: number
    size: number
    color: string
    rotation: number = 0

    constructor(options: {
        x: number,
        y: number,
        id?: string,
        color?: string,
        size?: number,
    }, world: Matter.World) {
        this.world = world
        this.x = options.x
        this.y = options.y
        this.size = options.size ? options.size : 16
        this.color = options.color ? options.color : "#00ff00"
        
        // Create composite
        this.composite = Matter.Composite.create({ label: `ball,${options.id}` })
        
        // Create body
        const body = Matter.Bodies.circle(this.x, this.y, this.size, {
            label: "ball",
            collisionFilter: collisionItem,
            friction: 0.01,
            frictionAir: 0.001,
            restitution: 0.9,
            // mass: .4,
            // density: .2,
            render: {
                fillStyle: "orange",
                // sprite: {
                //     texture: "render-circle-helper.png",
                //     xScale: (this.size * 2) / 512,
                //     yScale: (this.size * 2) / 512,
                // }
            }
        })


        Matter.Composite.add(this.composite, body)
        Matter.World.add(this.world, this.composite)
        requestAnimationFrame(this.#loop.bind(this))
    }

    #loop() {
        const targetBody = this.composite.bodies[0]
        this.x = targetBody.position.x
        this.y = targetBody.position.y
        this.rotation = targetBody.angle
        if (this.y < 100) {
            targetBody.collisionFilter.group = -1
        } else {
            targetBody.collisionFilter.group = 0
        }
        requestAnimationFrame(this.#loop.bind(this))
    }

}

export default Ball