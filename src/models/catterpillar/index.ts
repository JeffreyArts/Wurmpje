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
        headConstraint?: Matter.Constraint,
        buttConstraint?: Matter.Constraint
        bellyConstraint?: Matter.Constraint
        tickerFn?: () => void,
        contractionTween?: gsap.core.Tween
    }
    length: number
    thickness: number
    primaryColor: string
    secondaryColor: string
    baseTextureDir: typeof availableBodyPartTextures[number]
    isStanding: boolean
    isMoving: boolean

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
        this.isStanding = false
        this.isMoving = false

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
                    // stiffness: 0.5,
                    // damping: 0.1,
                    label: "bodyPartConnection",
                    render: {
                        visible: this.dev,
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

    #removeContraction() {
        if (!this.contraction) {
            return
        }


        if (this.contraction.buttConstraint) {
            Matter.Composite.remove(this.composite, this.contraction.buttConstraint)
        }

        if (this.contraction.headConstraint) {
            Matter.Composite.remove(this.composite, this.contraction.headConstraint)
        }

        if (this.contraction.bellyConstraint) {
            Matter.Composite.remove(this.composite, this.contraction.bellyConstraint)
        }

        if (this.contraction.tickerFn) {
            gsap.ticker.remove(this.contraction.tickerFn)
        }

        if (this.contraction.contractionTween) {
            this.contraction.contractionTween.kill()
        }

        this.contraction = undefined
    }

    // perc: number between 0 and 1 to determin the contraction width
    // duration: duration in seconds
    contractSpine = (perc = .5, duration = .5) => {

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
                    } else {
                        buttConstraint.pointB.x = this.head.body.position.x - obj.length
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
    releaseSpine = (duration =  .4) => {
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

            if (this.contraction.tickerFn) {
                gsap.ticker.remove(this.contraction.tickerFn)
            }

            if (this.contraction.headConstraint) {
                Matter.Composite.remove(this.composite, this.contraction.headConstraint)
            }

            if (this.contraction.buttConstraint) {
                this.contraction.buttConstraint.stiffness = 1
            }
            
            const newLength = this.#calculateLength()
            this.contraction.contractionTween =  gsap.to(this.spine, {
                length: newLength,
                duration: duration,
                ease:  "linear",
                onComplete: () => {
                    // remove constraints
                    this.#removeContraction()

                    resolve(true)
                }
            })
        })
    }


    // angle: degrees between -45 & 45 where 0 is upright
    // speed: amount of seconds to reach the standing angle
    standUp = (angle = 0, speed = 2) => {
        return new Promise(async (resolve, reject) => {

            if (this.isMoving) {
                console.warn("Catterpillar is moving, cannot stand up now")
                return reject()
            }

            const buttConstraint = Matter.Constraint.create({
                bodyA: this.butt.body,
                pointB: { x: this.butt.body.position.x, y: this.butt.body.position.y },
                length: 0,
                stiffness: 1,
                label: "buttConstraint",
                render: {
                    visible: this.dev,
                    strokeStyle: "brown",
                    type: "line",
                }
            })
            const bellyBody = this.bodyParts[Math.ceil(this.bodyParts.length / 2)].body
            
            const bellyConstraint = Matter.Constraint.create({
                bodyA: bellyBody,
                pointB: { x: bellyBody.position.x, y: bellyBody.position.y },
                length: 0,
                stiffness: 0.5,
                label: "bellyConstraint",
                render: {
                    visible: this.dev,
                    strokeStyle: "orange",
                    type: "line",
                }
            })

            if (!this.contraction) {
                this.contraction = {
                }
            } else {
                if (this.contraction.tickerFn) {
                    gsap.ticker.remove(this.contraction.tickerFn)
                }
                if (this.contraction.headConstraint) {
                    Matter.Composite.remove(this.composite, this.contraction.headConstraint)
                }
                if (this.contraction.contractionTween) {
                    this.contraction.contractionTween.kill()
                }

            }
            
            if (!this.contraction.buttConstraint) {
                this.contraction.buttConstraint = buttConstraint
                Matter.Composite.add(this.composite, buttConstraint)
            }

            if (!this.contraction.bellyConstraint) {
                this.contraction.bellyConstraint = bellyConstraint
                Matter.Composite.add(this.composite, bellyConstraint)
            }
            

            
            const obj = { perc: 0, angle: 0, spineLength: this.spine.length, bellyX: bellyBody.position.x }
            let angleX = 0
            let angleY = 0

            const factor = 2 - (1 + angle / 180)

            this.contraction.contractionTween = gsap.to(obj, {
                perc: 1,
                angle: angle,
                duration: speed,
                spineLength: this.#calculateLength() * .75 * factor,
                ease: "power1.out",
                onUpdate: () => {
                    const angleRad = (obj.angle - 90) * (Math.PI / 180)
                    const radius = this.thickness / 2


                    angleX = radius * Math.cos(angleRad) * obj.perc
                    angleY = radius * Math.sin(angleRad) * obj.perc
                
                    this.spine.length = obj.spineLength 

                    Matter.Body.setVelocity( this.head.body, {
                        x: angleX,
                        y: angleY,
                    })
                },
                onComplete: () => {
                    
                    if (this.contraction) {
                        this.isStanding = true
                        this.contraction.tickerFn = () => {
                            Matter.Body.setVelocity( this.head.body, {
                                x: angleX,
                                y: angleY,
                            })
                        }
                        gsap.ticker.add(this.contraction.tickerFn)
                    }
                    resolve(true)
                }
            })
        })
    }

    releaseStance = () => {
        return new Promise((resolve, reject) => {
            this.isStanding = false
            if (!this.contraction) {
                return reject()
            }

            if (this.contraction.tickerFn) {
                gsap.ticker.remove(this.contraction.tickerFn)
            }

            if (this.contraction.buttConstraint) {
                Matter.Composite.remove(this.composite, this.contraction.buttConstraint)
            }
        
            if (this.contraction.bellyConstraint) {
                Matter.Composite.remove(this.composite, this.contraction.bellyConstraint)
            }
            gsap.to(this.spine, {
                length: this.#calculateLength(),
                duration:  .4,
                ease:  "linear",
                onComplete: () => {
                    this.#removeContraction()
                    resolve(true)
                }
            })
            this.contraction = undefined
        })
    }


    async move() {
        this.isMoving = true
        await this.contractSpine(0.5)
        await this.releaseSpine(0.5)
        this.isMoving = false
    }

    async turnAround() {
        
        if (this.head.body.position.x < this.butt.body.position.x) {
            await this.standUp(90, .6)
        } else {
            await this.standUp(-90, .6)
        }

        await this.releaseStance()
    }

}

export default Catterpillar