import Matter from "matter-js"
import { collisionWall } from "@/tamagotchi/collisions"

export class Wall {
    body: Matter.Body
    world: Matter.World

    constructor({ x, y, width, height, id }: {
        x: number,
        y: number,
        width: number,
        height: number,
        id?: string,
    }, 
    world: Matter.World
    ) {
        this.world = world

        // Set body
        this.body = Matter.Bodies.rectangle(x, y, width, height, { isStatic: true, collisionFilter: collisionWall })
        this.body.label = "wall"
        if (id) {
            this.body.label += `,${id}`
        }

        // Add to world
        Matter.World.add(this.world, this.body)
    }
}