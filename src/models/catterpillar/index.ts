import Matter from "matter-js"
import gsap from "gsap"
import { Mouth } from "./mouth"
import { Eye } from "./eye"
import { BodyPart } from "./bodypart"
import Color from "@/models/color"



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
    pins: Matter.Constraint[]
    contraction?: {
        headConstraint?: Matter.Constraint,
        buttConstraint?: Matter.Constraint
        bellyConstraint?: Matter.Constraint
        tickerFn?: () => void,
        contractionTween?: gsap.core.Tween
    }
    length: number
    thickness: number
    stroke: number = 0
    primaryColor: string = "#00ff00"
    secondaryColor: string = "#007700"
    texture: { top?: string, "360"?: string, bottom?: string, vert?: string, stroke?: boolean } = {}
    
    isStanding: boolean = false
    isMoving: boolean = false
    isScared: boolean = false

    scared:{
        timeout?: NodeJS.Timeout | number,
        timeoutAction?: NodeJS.Timeout | number,
    } = {}

    constructor(options: {
        id: string,
        x: number,
        y: number,
        primaryColor: string,
        secondaryColor: string,
        texture: { top?: string, "360"?: string, bottom?: string, vert?: string, stroke?: boolean },
        offset: number,
        length: number,
        thickness?: number,
    }, world: Matter.World) {
        this.world = world
        this.dev = true
        this.pins = []
        
        this.x = options.x
        this.y = options.y
        this.length = options.length
        this.thickness = options.thickness ? options.thickness : 16
        this.bodyParts = []
        
        if (options.primaryColor && options.secondaryColor ) {
            this.#setColors(options.primaryColor, options.secondaryColor, options.offset)
        }

        if (options.texture) {
            this.texture = options.texture
        }

        if (this.texture.stroke) {
            this.stroke = this.thickness * 0.05
        }
        
        // Create composite
        this.composite = Matter.Composite.create({ label: `catterpillar,${options.id}` })
        
        // Create body parts
        this.#createBodyParts()
        this.#createSpine()

        const scale = this.thickness / 16
        this.mouth = new Mouth({
            ref: this.head,
            scale: scale,
            offset: {
                x: 0,
                y: 2.4 * scale
            }
        })
        
        this.mouth.moveToState("🙂")

        // // Add body parts to composite
        // for (const part of this.bodyParts) {
        //     Matter.Composite.add(this.composite, part.body);
        //     console.log(part.type)
        // }
    

        Matter.World.add(this.world, this.composite)
        requestAnimationFrame(this.#loop.bind(this))
    }

    #loop() {

        // Set X & Y values based on the center body part
        const centerIndex = Math.round(this.bodyParts.length / 2)
        this.x = this.bodyParts[centerIndex].body.position.x
        this.y = this.bodyParts[centerIndex].body.position.y


        // Update mouth offset
        const offsetX = (this.head.x - this.x) / (this.#calculateLength() / 2)
        this.mouth.offset.x = offsetX * (this.thickness * 0.08) 

        this.#autoCheckScared()
        
        requestAnimationFrame(this.#loop.bind(this))
    }

    #autoCheckScared() {
        const head = this.head.body
        const butt = this.butt.body

        const velocity = Math.abs(head.velocity.x) + Math.abs(head.velocity.y) 
        if (velocity > 20 && !this.isMoving && (Math.abs(head.position.y - butt.position.y) > this.thickness)) {
            
            if (this.isScared) {
                clearTimeout(this.scared.timeout)
                clearTimeout(this.scared.timeoutAction)
            } else {
                // this.eye.left.stopBlinking()
                // this.eye.right.stopBlinking()
                this.mouth.moveToState("😮", 1.28)
                this.isScared = true
            }
            
            this.scared.timeout = setTimeout(() => {
                this.scared.timeout = 0
                this.scared.timeoutAction = setTimeout(() => {
                    // this.eye.left.blink()
                    // this.eye.right.blink()
                    this.mouth.moveToState("🙂", 3.2)
                    this.isScared = false
                    // this.mouthRecovering = false
                    // this.eye.left.autoBlink = true
                    // this.eye.right.autoBlink = true
                }, 1600)

            }, 200)
        }
    }

    #calculateLength() {
        return this.length * this.thickness - this.thickness
    }

    #setColors(primaryColor: string, secondaryColor: string, offset: number) {
        const c1 = new Color(primaryColor)
        const c2 = new Color(secondaryColor)
        
        if (offset == 0) {
            // no change
        } else if (offset == 1) {
            c1.adjustHsl(0,0,.1)
            c2.adjustHsl(0,0,.1)       
        } else if (offset == 2) {
            c1.adjustHsl(0,.08,0)
            c2.adjustHsl(0,0.1,0.1)       
        } else if (offset == 3) {
            c1.adjustHsl(.08,0,0)
            c2.adjustHsl(0,0,.08)       
        } else if (offset == 4) {
            c1.adjustHsl(.02,0,0)
            c2.adjustHsl(-.02,0,0)       
        } else if (offset == 5) {
            c1.adjustHsl(-.04,0,0)
            c2.adjustHsl(.08,-.04,0)       
        } else if (offset == 6) {
            c1.adjustHsl(.1,0,0.02)
            c2.adjustHsl(-.1,-.08,0)       
        } else if (offset == 7) {
            c1.adjustHsl(1,0,-0.04)
            c2.adjustHsl(6,0,0.06)       
        } else if (offset == 8) {
            c1.adjustHsl(0,0,0)
            c2.adjustHsl(4,0,0)       
        } else if (offset == 9) {
            c1.adjustHsl(10,0,0.08)
            c2.adjustHsl(10,0,.02)       
        } else if (offset == 9) {
            c1.adjustHsl(0,0,0)
            c2.adjustHsl(0,0,0)       
        } else if (offset == 10) {
            c1.adjustHsl(-8,0,0.1)
            c2.adjustHsl(-5,0,0.1)       
        } else if (offset == 11) {
            c1.adjustHsl(-4,0.1,0.1)
            c2.adjustHsl(-8,0.1,0.1)       
        } else if (offset == 12) {
            c1.adjustHsl(1,-0.1,0.1)
            c2.adjustHsl(-2,0.1,0)       
        } else if (offset == 13) {
            c1.adjustHsl(0,0.1,0)
            c2.adjustHsl(0,0.1,0)       
        } else if (offset == 14) {
            c1.adjustHsl(0,0.2,0.04)
            c2.adjustHsl(0,0.2,0.04)       
        } else if (offset == 15) {
            c1.adjustHsl(3,0.1,.05)
            c2.adjustHsl(-2,0.05,0)       
        }

        this.primaryColor = c1.toHex()
        this.secondaryColor = c2.toHex()
    }

    #createSpine() {
        this.spine = Matter.Constraint.create({
            bodyA: this.head.body,
            bodyB: this.butt.body,
            length: this.#calculateLength(),
            stiffness: .5, // This influences the switching of direction .8 seems to cause issues with certain lengths
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
                collisionGroup: -1 * catterpillars.length - 1,
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
                    stiffness: 0.2,
                    damping: 0.1,
                    label: `bodyPartConnection,${part.body.id},${prev.body.id}`,
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

    #isPointingLeft() {
        return this.head.body.position.x < this.butt.body.position.x
    }

    #isPointingRight() {
        return this.head.body.position.x > this.butt.body.position.x
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
                    const maxVelocity = this.thickness * 0.00006

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

            this.contraction.tickerFn = () => {
                const directionX =  this.#isPointingLeft() ? -1 : 1
                Matter.Body.setVelocity(this.head.body, {
                    x: directionX,
                    y: 0
                })
            }
            gsap.ticker.add(this.contraction.tickerFn)

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
            const bellyBody = this.bodyParts[Math.floor((this.bodyParts.length-1) / 2) + 1].body
            bellyBody.render.fillStyle = "purple"
            const bellyConstraint = Matter.Constraint.create({
                bodyA: bellyBody,
                pointB: { x: bellyBody.position.x, y: bellyBody.position.y },
                length: 0,
                stiffness: 0.16, // A higher stiffness make is harder to switch direction
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

            let factor = 2 - (1 + angle / 180)
            
            // This works for turn around, but not for left/right stand up
            if (bellyBody.position.x > this.butt.body.position.x) {
                factor = 2 - (1 + -angle / 180)
            }
                
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

            let loosenConstraint, loosenConstraintStiffness

            this.composite.constraints.forEach(constraint => {
                if (constraint.label.startsWith(`bodyPartConnection,${this.butt.body.id}`)) {
                    loosenConstraint = constraint
                    loosenConstraintStiffness = constraint.stiffness
                    loosenConstraint.stiffness = 0.01
                }
            })


            if (this.contraction.bellyConstraint) {
                Matter.Composite.remove(this.composite, this.contraction.bellyConstraint)
            }
            
            if (this.contraction.buttConstraint) {
                Matter.Composite.remove(this.composite, this.contraction.buttConstraint)
            }

            gsap.to(this.spine, {
                length: this.#calculateLength(),
                duration:  .4,
                ease:  "linear",
                onComplete: () => {
                    
                    loosenConstraint.stiffness = loosenConstraintStiffness
                    
                    this.#removeContraction()
                    
                    resolve(true)
                }
            })

        })
    }


    async move() {
        this.isMoving = true
        // Deze collision check werkt niet goed
        // const headCollisions = Matter.Query.collides(this.head.body, this.world.bodies)
        // const buttCollisions = Matter.Query.collides(this.butt.body, this.world.bodies)
        // if (headCollisions.length < 1 || buttCollisions.length < 1) {
        //     console.warn("Catterpillar is colliding, cannot move now")
        //     this.isMoving = false
        //     return
        // }
        
        try {
            await this.contractSpine(0.5, 0.8 * this.length / 10)
            await this.releaseSpine(0.8 * this.length / 10)
        } catch {
            
        }
        this.isMoving = false
    }

    turnAround = async () => {
        
        if (this.#isPointingLeft()) {
            await this.standUp(90, 1 * this.length / 10)
        } else {
            await this.standUp(-90, 1 * this.length / 10)
        }

        await this.releaseStance()
    }

    pin(bodyPart: BodyPart, pinPos: { x: number, y: number, name?: string }) : Matter.Constraint {
        // Create constraint
        let label = `pinConstraint,${bodyPart.body.id}`
        if (pinPos.name) {
            label = `pinConstraint,${pinPos.name},${bodyPart.body.id}`
        }
        const pinConstraint = Matter.Constraint.create({
            bodyA: bodyPart.body,
            pointB: { x: pinPos.x, y: pinPos.y },
            length: 0,
            stiffness: 0.02,
            damping: 1,
            label,
            render: {
                visible: this.dev,
                strokeStyle: "blue",
                type: "line",
            }
        })
        Matter.Composite.add(this.composite, pinConstraint)
        this.pins.push(pinConstraint)
        return pinConstraint
    }

    unpin(pinConstraint:  Matter.Constraint) {
       
        if (pinConstraint) {
            Matter.Composite.remove(this.composite, pinConstraint)
        }

        this.pins = this.pins.filter(pin => pin !== pinConstraint)
    }

    remove() {
        Matter.Composite.remove(this.world, this.composite)
    }
}

export default Catterpillar