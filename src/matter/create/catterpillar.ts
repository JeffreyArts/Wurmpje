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
            svgTextureDir: "",
            hasStroke: false,
            length: 9,
            thickness: 24,
        }
        console.log(this.world)

        // Set composite
        this.ref = new CatterpillarModel(catterPillarOptions, world)
    }
}