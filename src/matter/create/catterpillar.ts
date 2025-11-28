import Matter from "matter-js"
import CatterpillarModel from "@/models/catterpillar/index"
import type { IdentityField } from "@/models/identity"

export class Catterpillar {
    ref: CatterpillarModel
    world: Matter.World
    identity: IdentityField

    constructor({ x, y, identity }: {
        x: number,
        y: number,
        identity: IdentityField,
    }, world: Matter.World) {
        this.world = world
        this.identity = identity


    
        const catterPillarOptions =  {
            id: identity.id.toString(),
            x: x,
            y: y,
            primaryColor: "",
            secondaryColor: "",
            svgTexture: "",
            hasStroke: false,
            length: 9,
            thickness: 24,
            autoBlink: true,
            stiffness: 0.1,
            bodyPart: {
                size: 32,
                restitution: 0.5,
            }
        }

        // Set composite
        this.ref = new CatterpillarModel(catterPillarOptions, world)

        // this.ref.butt.render.fillStyle = "#ff0099"
        // this.ref.composite.collisionFilter.group = 1

        // Add to world
        // Matter.World.add(this.world, this.ref.composite);
    }
}