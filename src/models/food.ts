import Matter from "matter-js"
import { collisionFood } from "@/tamagotchi/collisions"

export class Food {
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
        
        console.log("Creating food", this.x, this.y)
        // Create composite
        this.composite = Matter.Composite.create({ label: `food,${options.id}` })
        
        // Create body
        const body = Matter.Bodies.rectangle(this.x, this.y, this.size, this.size, {
            label: "food",
            collisionFilter: collisionFood,
            render: {
                fillStyle: "green"
            }
        })

        Matter.Composite.add(this.composite, body)
        Matter.World.add(this.world, this.composite)
        requestAnimationFrame(this.#loop.bind(this))
    }

    #loop() {
        const targetBody = this.composite.bodies[0]
        // console.log(targetBody)
        this.x = targetBody.position.x
        this.y = targetBody.position.y
        this.rotation = targetBody.angle
        requestAnimationFrame(this.#loop.bind(this))
    }

}

export default Food