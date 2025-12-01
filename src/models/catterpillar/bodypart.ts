import Matter from "matter-js"

export type BodyPartOptions = {
    size: number,
    stiffness?: number,
    damping?: number,
    slop?: number,
    points?: number,
    restitution?: number,
}


export class BodyPart {
    x: number
    y: number
    radius: number
    body: Matter.Body
    options: {
        restitution: number
        slop: number,
    }
    dev: boolean
    type: "bodyPart" | "head" | "butt"


    constructor (
        options: {
            radius: number,
            x?: number,
            y?: number,
            restitution?: number,
            slop?: number,
            type?: "head" | "butt",
            collisionGroup?: number  // negative for non-colliding
        }
    ) {
        this.dev = true
        this.options = {
            restitution: .5,
            slop: .01,
        }

        this.x = options?.x ? options.x : 0
        this.y = options?.y ? options.y : 0
        this.radius = options?.radius ? options.radius : 8
        
        // Set label
        this.type = "bodyPart"
        if (options?.type) {
            this.type = options.type
        }
        
        
        if (options?.restitution) {
            this.options.restitution = options.restitution
        }

        if (options?.slop) {
            this.options.slop = options.slop
        }
        
        const label = this.type == "bodyPart" ? "bodyPart" : `bodyPart,${this.type}`

        const group = options?.collisionGroup ? options.collisionGroup : 0

        this.body = Matter.Bodies.circle(this.x, this.y, this.radius, { 
            collisionFilter: { group },
            mass: 1,
            density: .2,
            friction: 20,
            restitution: this.options.restitution,
            slop: 1,
            label,
            render: {
                visible: this.dev,
            }
        })

        requestAnimationFrame(() => this.#loop())
    }


    #loop() {
        this.x = this.body.position.x
        this.y = this.body.position.y
        requestAnimationFrame(() => this.#loop())
    }
}

export default BodyPart