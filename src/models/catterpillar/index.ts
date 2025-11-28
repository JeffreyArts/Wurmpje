import Matter from "matter-js"
import gsap from "gsap"
import { Mouth } from "./mouth"
import { Eye } from "./eye"
import { BodyPart } from "./bodypart"

// eslint-disable-next-line 
const availableBodyPartTextures = [
    "/bodyparts/360/camo",
    "/bodyparts/360/cow",
    "/bodyparts/360/dots",
    "/bodyparts/360/giraffe",
    "/bodyparts/360/leafs",
    "/bodyparts/360/panter",
    "/bodyparts/360/paths",
    "/bodyparts/360/polkadots",
    "/bodyparts/360/worms",
    "/bodyparts/bottom/b1",
    "/bodyparts/bottom/b2",
    "/bodyparts/bottom/b3",
    "/bodyparts/bottom/b4",
    "/bodyparts/bottom/b5",
    "/bodyparts/bottom/b6",
    "/bodyparts/bottom/b7",
    "/bodyparts/bottom/b8",
    "/bodyparts/top/t1",
    "/bodyparts/top/t2",
    "/bodyparts/top/t3",
    "/bodyparts/top/t4",
    "/bodyparts/top/t5",
    "/bodyparts/top/t6",
    "/bodyparts/top/t7",
    "/bodyparts/top/t8",
    "/bodyparts/top/t9",
    "/bodyparts/top/t10",
    "/bodyparts/vert/v1",
    "/bodyparts/vert/v2",
    "/bodyparts/vert/v3",
    "/bodyparts/vert/v4",
    "/bodyparts/vert/v5",
    "/bodyparts/vert/v6",
]


export class Catterpillar {
    dev: boolean
    bodyParts: BodyPart[]
    composite: Matter.Composite
    world: Matter.World
    mouth: Mouth
    eyes: Eye[]
    x: number
    y: number
    head: BodyPart
    butt: BodyPart
    spine: Matter.Constraint
    contraction?: {
        headConstraint: Matter.Constraint,
        buttConstraint: Matter.Constraint
        tickerFn?: () => void,
        contractionTween?: gsap.core.Tween
    }
    length: number
    thickness: number
    primaryColor: string
    secondaryColor: string
    baseTextureDir: typeof availableBodyPartTextures[number]
    

    constructor(options: {
        id: string,
        x: number,
        y: number,
        primaryColor: string,
        secondaryColor: string,
        svgTextureDir: string,
        hasStroke: boolean,
        length: number,
        thickness?: number,
    }, world: Matter.World) {
        this.world = world
        this.dev = true

        this.x = options.x
        this.y = options.y
        this.length = options.length
        this.thickness = options.thickness ? options.thickness : 16
        this.bodyParts = []

        this.primaryColor = options.primaryColor
        this.secondaryColor = options.secondaryColor
        this.baseTextureDir = options.svgTextureDir

        // Create composite
        this.composite = Matter.Composite.create({ label: `catterpillar,${options.id}` })

        // Create body parts
        this.#createBodyParts()
        this.#createSpine()

        
        // // Add body parts to composite
        // for (const part of this.bodyParts) {
        //     Matter.Composite.add(this.composite, part.body);
        //     console.log(part.type)
        // }
    

        Matter.World.add(this.world, this.composite)
        
    }

    #calculateLength() {
        return this.length * this.thickness - this.thickness
    }

    #createSpine() {
        this.spine = Matter.Constraint.create({
            bodyA: this.head.body,
            bodyB: this.butt.body,
            length: this.#calculateLength(),
            stiffness: .8,
            damping: .1,
            label: "spine",
            render: {
                visible: this.dev,
                strokeStyle: "#4f0944",
                type: "spring",
            }
        })
        Matter.Composite.add(this.composite, this.spine)
    }

    #createBodyParts() {
        
        // Empty bodyparts
        this.bodyParts = []
        let prev: BodyPart | undefined

        for (let i = 0; i < this.length; i++) {

            const svgTexture = `${this.baseTextureDir}/${i%8 + 1}.svg`
            
            let type: "head" | "butt" | undefined
            if (i == 0) {
                type = "head"
            } else if (i == this.length -1) {
                type = "butt"
            }

            const offsetX = this.length * this.thickness / 2
            const x = this.x - offsetX + i * this.thickness

            // Select amount of catterPillars in the world
            const catterpillars = this.world.composites.filter(comp => {
                return comp.label.startsWith("catterpillar")
            })
            
            const compositeParts = []
            const bodyPartOptions = {
                radius: this.thickness,
                x,
                y: this.y,
                primaryColor: this.primaryColor,
                secondaryColor: this.secondaryColor,
                collisionGroup: -1 * catterpillars.length - 1,
                svgTexture,
            }

            if (type) {
                bodyPartOptions["type"] = type
            }


            const part = new BodyPart(bodyPartOptions)
            this.bodyParts.push(part)
            compositeParts.push(part.body)

            if (prev) {
                const length = (part.radius/2 + prev.radius/2) + .1
                const constraint = Matter.Constraint.create({
                    bodyA: part.body,
                    bodyB: prev.body,
                    pointA: { x: 0, y:0 },
                    pointB: { x: 0, y:0 },
                    length,
                    stiffness: 0.5,
                    damping: 0.1,
                    label: "bodyPartConnection",
                    render: {
                        strokeStyle: "#444",
                        type:"line",
                    }
                })
                
                compositeParts.push(constraint)
            }

            
            Matter.Composite.add(
                this.composite, compositeParts
            )
            
            this.head = this.bodyParts[0]
            this.butt = this.bodyParts[this.bodyParts.length -1]

            prev = part

        }
    }

    // perc: number between 0 and 1 to determin the contraction width
    // duration: duration in seconds
    contractSpine(perc = .5, duration = .5) {

        return new Promise((resolve, reject) => {
            
            if (this.contraction) {
                console.warn("Catterpillar is already in a contracting state")
                return reject()
            }

            // Calculate new length
            const newLength = this.#calculateLength() * perc
            
            // Stick head to ground via a constraint
            const headConstraint = Matter.Constraint.create({
                bodyA: this.head.body,
                pointB: { x: this.head.body.position.x, y: this.head.body.position.y },
                length: 0,
                stiffness: 1,
                label: "headConstraint",
                render: {
                    visible: this.dev,
                    strokeStyle: "#9f0",
                    type: "line",
                }
            })

            // Stick butt to ground via a constraint
            const buttConstraint = Matter.Constraint.create({
                bodyA: this.butt.body,
                pointB: { x: this.butt.body.position.x, y: this.butt.body.position.y },
                length: 0,
                stiffness: .3,
                label: "buttConstraint",
                render: {
                    visible: this.dev,
                    strokeStyle: "brown",
                    type: "line",
                }
            })

            Matter.Composite.add(this.composite, headConstraint)
            Matter.Composite.add(this.composite, buttConstraint)
            
            // Save contraction state
            this.contraction = {
                headConstraint,
                buttConstraint,
            }



            // Start contraction via GSAP tween
            const obj = { ...this.spine, perc, buttX: Math.abs(this.butt.body.position.x - this.head.body.position.x) }

            this.contraction.contractionTween = gsap.to(obj, {
                length: newLength,
                duration: duration,
                perc: 1,
                ease:  "linear",
                buttX: obj.buttX - newLength/2,
                onUpdate: () => {
                    if (!this.contraction) {
                        this.contraction.contractionTween.kill()
                        return
                    }

                    this.spine.length = obj.length
                    const maxVelocity = .0005

                    // Move buttConstraint.pintB.x to simulate pushing off
                    if (this.butt.body.position.x > this.head.body.position.x) {
                        buttConstraint.pointB.x = this.head.body.position.x + obj.length
                    }


                    this.bodyParts.forEach((bp, index) => {
                        const centerIndex = this.#calculateLength() / 2
                        const distanceFromCenter = centerIndex - Math.abs(index - centerIndex)
                        
                        // change Y velocity to simulate bounce
                        Matter.Body.applyForce( bp.body,bp.body.position, {
                            // x: (this.head.position.x - this.butt.position.x),
                            x: 0,
                            y: distanceFromCenter * -maxVelocity,
                        })
                    })
                },
                onComplete: () => {
                    this.contraction.tickerFn = () => {
                        const centerIndex = this.bodyParts.length / 2
                        const maxVelocity = .4

                        // Keep arch by setting Y velocity based on distance from center
                        this.bodyParts.forEach((bp, index) => {
                            const distanceFromCenter = centerIndex - Math.abs(index - centerIndex)

                            Matter.Body.setVelocity(bp.body, {
                                x: 0,
                                y: distanceFromCenter * -maxVelocity,
                            })
                        })
                    }
                    gsap.ticker.add(this.contraction.tickerFn)
                    
                    resolve(true)
                }
            })
        })
    }


    // duration: duration in seconds
    releaseSpine(duration =  .4) {
        return new Promise((resolve, reject) => {
            if (!this.contraction) {
                console.warn("Catterpillar is not in a contracting state")
                return reject()
            }
            // Kill contraction tween when it is still running
            if (this.contraction.contractionTween) {
                this.contraction.contractionTween.kill()
            }

            // this.bodyParts.forEach((bp, index) => {
            //     Matter.Body.setVelocity(bp.body, {
            //         x: 0,
            //         y: 0,
            //     })
            // })

            if (this.contraction?.tickerFn) {
                gsap.ticker.remove(this.contraction.tickerFn)
            }

            Matter.Composite.remove(this.composite, this.contraction.headConstraint)

            const newLength = this.#calculateLength()
            if (this.contraction.buttConstraint) {
                this.contraction.buttConstraint.stiffness = 1
            }
                
            this.contraction.contractionTween =  gsap.to(this.spine, {
                length: newLength,
                duration: duration,
                ease:  "linear",
                onComplete: () => {
                    // remove constraints
                    if (this.contraction) {
                        if (this.contraction.buttConstraint) {
                            Matter.Composite.remove(this.composite, this.contraction.buttConstraint)
                        }

                        if (this.contraction.headConstraint) {
                            Matter.Composite.remove(this.composite, this.contraction.headConstraint)
                        }

                        if (this.contraction.tickerFn) {
                            gsap.ticker.remove(this.contraction.tickerFn)
                        }

                        if (this.contraction.contractionTween) {
                            this.contraction.contractionTween.kill()
                        }
                    }

                    this.contraction = undefined
                    resolve(true)
                }
            })
        })
    }
    
    
    async move(direction: "left" | "right") {

        await this.contractSpine(0.5)
        this.releaseSpine(0.5)
        
    }

}

export default Catterpillar