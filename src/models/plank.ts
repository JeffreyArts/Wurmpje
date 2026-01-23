import Matter from "matter-js"
import { collisionWall } from "@/tamagotchi/collisions"

export class Plank {
    body: Matter.Body
    world: Matter.World
    x: number
    y: number
    width: number
    height: number
    color: string = "orange"
    isMovable: boolean = false
    isDestroyed: boolean = false

    constructor(options: {
        x: number,
        y: number,
        id?: string,
        width?: number,
        color?: string,
    }, world: Matter.World) {
        this.world = world
        this.x = options.x
        this.y = options.y
        this.width = options.width ? options.width : 16
        this.height = 16
        this.color = options.color ? options.color : "black"
        
        // Create body
        this.body = Matter.Bodies.rectangle(this.x, this.y, this.width, this.height, {
            label: `plank,${options.id}`,
            collisionFilter: collisionWall,
            friction: 0.1,
            frictionAir: 0.001,
            restitution: 0.9,
            isStatic: true,
            render: {
                fillStyle: "orange",
            }
        })
        
        // Matter.Composite.add(this.composite, body)
        Matter.World.add(this.world, this.body)
        requestAnimationFrame(this.#loop.bind(this))
    }

    #loop() {
        if (this.isDestroyed) {
            return
        }
        const targetBody = this.body

        this.x = targetBody.position.x
        this.y = targetBody.position.y

        requestAnimationFrame(this.#loop.bind(this))
    }

}

export default Plank