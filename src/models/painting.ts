import Matter from "matter-js"
import { collisionItem } from "@/tamagotchi/collisions"

// body.inertia = Infinity  // locks rotation
export class Painting {
    composite: Matter.Composite
    world: Matter.World
    x: number
    y: number
    width: number
    height: number
    rotation: number = 0
    image: string
    name: string = ""
    isDestroyed: boolean = false

    constructor(options: {
        x: number,
        y: number,
        id?: string,
        image?: string,
        width?: number,
        height?: number,
    }, world: Matter.World) {
        this.world = world
        this.x = options.x
        this.y = options.y
        this.width = options.width ?? 128
        this.height = options.height ?? 128
        this.image = options.image

        // Composite
        this.composite = Matter.Composite.create({ label: `painting,${options.id}` })

        // Canvas body
        const body = Matter.Bodies.rectangle(
            this.x,
            this.y + this.height * .8, // position body slightly below the image to create a hanging effect
            this.width,
            this.height,
            {
                mass: 16,
                label: "canvas",
                collisionFilter: collisionItem,
                render: { fillStyle: "orange" }
            }
        )
        body.inertia = Infinity  // locks rotation

        // Anchor body (static)
        const anchor = Matter.Bodies.circle(this.x, this.y, 3, {
            isStatic: true,
            label: "anchor",
            render: { visible: false }
        })

        // Left rope (anchored to anchor, ending at canvas left)
        const ropeLeft = this.#createRope({
            bodyStart: anchor,
            pointStart: { x: 0, y: 0 },
            bodyEnd: body,
            pointEnd: { x: -this.width / 2 + 8, y: -this.height / 2 + 8 },
            segments: 6,       // shorter segments
            thickness: 2,
            stiffness: 1,       // tight rope
            damping: 0.08       // prevents wobble
        })

        // Right rope (anchored to anchor, ending at canvas right)
        const ropeRight = this.#createRope({
            bodyStart: anchor,
            pointStart: { x: 0, y: 0 },
            bodyEnd: body,
            pointEnd: { x: this.width / 2 - 8, y: -this.height / 2 + 8 },
            segments: 6,
            thickness: 2,
            stiffness: 1,
            damping: 0.08
        })

        Matter.Composite.add(this.composite, [
            body,
            anchor,
            ropeLeft,
            ropeRight
        ])

        Matter.World.add(this.world, this.composite)
        requestAnimationFrame(this.#loop.bind(this))
    }

    #createRope({
        bodyStart,
        pointStart = { x: 0, y: 0 },
        bodyEnd,
        pointEnd = { x: 0, y: 0 },
        segments = 8,
        thickness = 2,
        stiffness = 1,
        damping = 0.08
    }) {
        const { Composite, Bodies, Constraint, Vector } = Matter
        const rope = Composite.create({ label: "rope" })

        // Calculate exact distance between start and end
        const startWorld = Vector.add(bodyStart.position, pointStart)
        const endWorld = Vector.add(bodyEnd.position, pointEnd)
        const delta = Vector.sub(endWorld, startWorld)
        const totalLength = Vector.magnitude(delta)
        const direction = Vector.normalise(delta)
        const segmentLength = totalLength / segments 

        let prevBody: Matter.Body | null = null

        for (let i = 0; i < segments; i++) {
            const position = Vector.add(
                startWorld,
                Vector.mult(direction, segmentLength * (i + 0.5))
            )

            const segment = Bodies.rectangle(
                position.x,
                position.y,
                segmentLength,
                thickness,
                {
                    collisionFilter: { group: -1 },
                    frictionAir: 0.02,
                    render: { visible: false }
                }
            )

            Composite.add(rope, segment)

            if (prevBody) {
            // Each segment exactly segmentLength apart
                Composite.add(
                    rope,
                    Constraint.create({
                        bodyA: prevBody,
                        bodyB: segment,
                        length: segmentLength,
                        // length: segmentLength,
                        stiffness,
                        damping
                    })
                )
            }

            prevBody = segment
        }

        // Pin start to anchor
        Composite.add(
            rope,
            Constraint.create({
                bodyA: bodyStart,
                pointA: pointStart,
                bodyB: rope.bodies[0],
                length: 0.1,
                stiffness,
                damping
            })
        )

        // Pin last segment to canvas at exact distance
        const lastSegment = rope.bodies[rope.bodies.length - 1]
        Composite.add(
            rope,
            Constraint.create({
                bodyA: lastSegment,
                bodyB: bodyEnd,
                pointB: pointEnd,
                length: 0.1, // exact distance to canvas
                stiffness,
                damping
            })
        )

        return rope
    }




    #loop() {
        if (this.isDestroyed) {
            return
        }
        
        const targetBody = this.composite.bodies[0]
        this.x = targetBody.position.x
        this.y = targetBody.position.y
        this.rotation = targetBody.angle
        requestAnimationFrame(this.#loop.bind(this))
    }

    destroy() {
        this.isDestroyed = true
        Matter.World.remove(this.world, this.composite)
    }
}

export default Painting