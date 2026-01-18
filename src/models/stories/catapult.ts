import Matter from "matter-js"
import Story from "@/models/story"
import type Catterpillar from "../catterpillar"
import BallModel from "@/models/ball"
import { type DBStory } from "@/stores/story"
import { collisionWall } from "@/tamagotchi/collisions"
import { reject } from "lodash"

class CatapultStory extends Story {
    type = "action" as const
    catterpillar = undefined as Catterpillar | undefined
    ball = undefined as BallModel | undefined
    ballConstraint = undefined as Matter.Constraint | undefined
    score: number = 0
    dbStory = undefined as DBStory | undefined
    
    phase1 = undefined as Promise<void> | undefined
    phase1Completed = false
    phase2 = undefined as Promise<void> | undefined
    phase2Completed = false
    phase3 = undefined as Promise<void> | undefined
    phase3Completed = false
    phase4 = undefined as Promise<void> | undefined
    phase4Completed = false

    isInLaunchPosition: boolean = false
    startPosition = undefined as Matter.Vector | undefined
    extraFloor = undefined as  Matter.Body | undefined
    
    async start() {
        console.info("Plankje test story started", this.identityStore)
        
        this.catterpillar = this.controller.catterpillar

        this.dbStory = await this.storyStore.getLatestDatabaseEntry("catapult")
        this.startPhase1()
    }


    loop() {
        if (!this.phase1) {
            this.startPhase1()
        } else if (this.phase1Completed && !this.phase2) {
            this.startPhase2()
        } else if (this.phase2Completed && !this.phase3 ) {
            this.startPhase3()
        } else if (this.phase3 && !this.phase3Completed) {
            // This is the state before launching the ball
        } else if (this.phase3Completed && !this.phase4) {
            this.cameraFollowBall()
            this.floorFollowBall()
            this.score = this.ball.x - this.catterpillar.x 
            this.startPhase4()
        }
    }

    async startPhase1() {
        // Make catterpillar crawl to the left wall for the catapult position

        this.phase1 = new Promise<void>(async (resolve) => {
            if (!this.catterpillar) {
                reject(new Error("Catterpillar not defined"))
            }
            this.catterpillar.emote("happy")
            
            if (this.catterpillar.isMoving) {
                return
            }

            if (this.catterpillar.isPointingLeft()) {
                await this.catterpillar.move()    
            } else {
                await this.catterpillar.turnAround()
            }

            if (this.catterpillar.head.x < this.catterpillar.length * this.catterpillar.thickness) {
                this.phase1Completed = true
            } else {
                this.phase1 = undefined
            }
            resolve()
        })
        return this.phase1
    }

    async startPhase2() {
        // Add ball, extra floor and make catterpillar stand up

        this.phase2 = new Promise<void>(async (resolve) => {
            if (!this.catterpillar) {
                reject(new Error("Catterpillar not defined"))
            }

            this.catterpillar.leftEye.lookRight(4,2)
            this.catterpillar.rightEye.lookRight(4,2)
            await this.catterpillar.standUp()
            await this.createBall()
            this.createExtraFloor()

            this.startPosition = Matter.Vector.create(this.ball.x, this.ball.y)
            this.phase2Completed = true
            resolve()
        })
            
    }

    async startPhase4() {
        if (this.ball.isMoving) {
            return
        }

        // Add event listeners for launching the ball
        this.phase4 = new Promise<void>(async (resolve) => {
            if (!this.catterpillar) {
                reject(new Error("Catterpillar not defined"))
            }
            this.phase3Completed = true
            alert(this.score)    
                
            resolve()
        })
    }

    async startPhase3() {
        // Add event listeners for launching the ball
        this.phase3 = new Promise<void>(async (resolve) => {
            if (!this.catterpillar) {
                reject(new Error("Catterpillar not defined"))
            }

            document.addEventListener("pointerdown", this.pointerDownEvent.bind(this))
            document.addEventListener("pointerup", this.pointerUpEvent.bind(this))

            // There should be a power meter here       
                
            resolve()
        })
    }

    showScore() {
        if (!this.dbStory) {
            return
        }
        
        console.info("Score:", this.score)
    }

    async pointerDownEvent() {
        if (this.phase3 && !this.phase3Completed) {
            // Start pulling back the ball
            this.isInLaunchPosition = true
            this.catterpillar.leftEye.pinch(.4)
            this.catterpillar.rightEye.pinch(.4)
            this.catterpillar.emote("hmm")
            // await this.catterpillar.releaseSpine(.1)
            await this.catterpillar.standUp(-70, 1)
        }
    }
            
    async pointerUpEvent() {
        if (this.phase3 && !this.phase3Completed) {
            if (!this.isInLaunchPosition) {
                return
            }
            // Start pulling back the ball
            this.catterpillar.leftEye.open(.4)
            this.catterpillar.rightEye.open(.4)
            await this.catterpillar.standUp(0, .05)
            this.launchBall()
            this.catterpillar.emote("happy")
            this.catterpillar.releaseStance()
            this.isInLaunchPosition = false
        }   
    }
     
    launchBall() {
        if (!this.ball || !this.startPosition) {
            return
        }

        const currentPosition = Matter.Vector.create(this.ball.x, this.ball.y)
        const launchVector = Matter.Vector.sub(this.startPosition, currentPosition)
        const launchMagnitude = Matter.Vector.magnitude(launchVector)

        // Limit the maximum launch power
        const maxLaunchPower = 150
        const clampedLaunchPower = Math.min(launchMagnitude, maxLaunchPower)

        // Apply force to the ball based on the launch power
        const forceMagnitude = clampedLaunchPower * 0.0005 // Adjust the multiplier for desired effect
        const forceVector = Matter.Vector.mult(Matter.Vector.normalise(launchVector), forceMagnitude)

        Matter.Body.applyForce(this.ball.composite.bodies[0], this.ball.composite.bodies[0].position, forceVector)

        // Remove the constraint
        if (this.ballConstraint) {
            Matter.World.remove(this.controller.ref.world, this.ballConstraint)
            this.ballConstraint = undefined
            this.phase3Completed = true
        }
    }
            
    cameraFollowBall() {
        const render = this.controller.ref.renderer
        const width  = render.options.width
        const height = render.options.height
        
        if (this.ball.x > width / 2) { 
            Matter.Render.lookAt(render, {
                min: {
                    x: this.ball.x - width / 2,
                    y: 0
                },
                max: {
                    x: this.ball.x + width / 2,
                    y: height
                }
            })
        }
    }

    floorFollowBall() {
        if (!this.extraFloor || !this.ball) {
            return
        }

        const floorY = this.extraFloor.position.y

        Matter.Body.setPosition(this.extraFloor, {
            x: this.ball.composite.bodies[0].position.x,
            y: floorY
        })
    }

    async createBall() {
        const x = this.catterpillar.head.x + this.catterpillar.thickness
        const y = this.catterpillar.head.y

        this.ball = new BallModel({
            x: x ,
            y: y,
            size: this.catterpillar.thickness,
            color: "aquamarine"
        }, this.controller.ref.world)

        this.ballConstraint = Matter.Constraint.create({
            bodyA: this.catterpillar.head.body,
            pointA: { x: this.catterpillar.thickness / 2, y: 0 },
            bodyB: this.ball.composite.bodies[0],
            pointB: { x: 0, y: 0 },
            length: this.catterpillar.thickness,
            stiffness: 0.9,
        })

        // Make ball not collide with left wall
        const rightWall = this.controller.ref.world.bodies.find(body => body.label.includes("wall,right"))
        
        if (rightWall) {
            rightWall.collisionFilter = {
                category: collisionWall.category,
                mask: 0
            }
        }

        // Every time ball collides with the floor, we can show the score
        Matter.Events.on(this.controller.ref.engine, "collisionStart", (event) => {
            event.pairs.forEach((pair) => {
                if (!this.ball) {
                    return
                }
                const ballBody = this.ball.composite.bodies[0]
                if ((pair.bodyA === ballBody && pair.bodyB === this.extraFloor) ||
                    (pair.bodyB === ballBody && pair.bodyA === this.extraFloor)) {
                    this.showScore()
                    ballBody.frictionAir += 0.0005
                }
            })
        })

        Matter.World.add(this.controller.ref.world, this.ballConstraint)
        
        this.controller.draw.addBall(this.ball)
    }

    createExtraFloor() {
        if (this.extraFloor) {
            return
        }
        const width = this.controller.ref.renderer.options.width
        const height = this.controller.ref.renderer.options.height
        const offsetY = this.controller.config.offsetBottom

        this.extraFloor = Matter.Bodies.rectangle(width/2, height - offsetY + 100, width*2, 200, {
            isStatic: true,
            label: "floor",
            collisionFilter: collisionWall,
            render: {
                fillStyle: "brown"
            }
        })
        Matter.World.add(this.controller.ref.world, this.extraFloor)
    }
    
    destroy() {
        super.destroy()
        if (this.ballConstraint) {
            Matter.World.remove(this.controller.ref.world, this.ballConstraint)
        }

        if (this.ball) {
            this.controller.draw.removeObjectById(this.ball.composite.id)
        }
    }
}

export default CatapultStory