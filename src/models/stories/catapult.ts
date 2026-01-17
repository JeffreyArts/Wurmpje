import Matter from "matter-js"
import Story from "@/models/story"
import type Catterpillar from "../catterpillar"
import type BodyPart from "../catterpillar/bodypart"
import BallModel from "@/models/ball"
import { type DBStory } from "@/stores/story"
import { collisionBodyPart, collisionWall } from "@/tamagotchi/collisions"
import { reject } from "lodash"

class CatapultStory extends Story {
    type = "action" as const
    catterpillar = undefined as Catterpillar | undefined
    ball = undefined as BallModel | undefined
    ballConstraint = undefined as Matter.Constraint | undefined
    dbStory = undefined as DBStory | undefined
    readyForAction: boolean = false
    phase1 = undefined as Promise<void> | undefined
    phase1Completed = false
    phase2 = undefined as Promise<void> | undefined
    phase2Completed = false
    phase3 = undefined as Promise<void> | undefined
    phase3Completed = false
    
    async start() {
        console.info("Plankje test story started", this.identityStore)

        
        this.catterpillar = this.controller.catterpillar

        this.dbStory = await this.storyStore.getLatestDatabaseEntry("catapult")
        this.crawlToLeft()
        // this.createBall()
    }

    async crawlToLeft() {
        this.phase1 = new Promise<void>(async (resolve) => {
            if (!this.catterpillar) {
                reject(new Error("Catterpillar not defined"))
            }
            
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

        // let timer = 0
        // while(!this.catterpillar.isOnSolidGround) {
        //     if (timer > 300) {
        //         break
        //     }
        //     timer++
        //     await this.catterpillar.move()
        // }
        // setTimeout(() => {
        //     this.crawlToLeft()
        // }, 100)
    }

    async getUp() {
        this.phase2 = new Promise<void>(async (resolve) => {
            if (!this.catterpillar) {
                reject(new Error("Catterpillar not defined"))
            }

            this.catterpillar.leftEye.lookRight(4,2)
            this.catterpillar.rightEye.lookRight(4,2)
            await this.catterpillar.standUp()
            await this.createBall()
            this.phase2Completed = true
            resolve()
        })
            
    }

    async launch() {
        this.phase3 = new Promise<void>(async (resolve) => {
            if (!this.catterpillar) {
                reject(new Error("Catterpillar not defined"))
            }
            const render = this.controller.ref.renderer
            const width  = render.options.width
            const height = render.options.height

            console.log("Launch the ball!", this.ball.x, width/2)
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
                
            resolve()
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
        
        Matter.World.add(this.controller.ref.world, this.ballConstraint)
        
        this.controller.draw.addBall(this.ball)

    }


    loop() {
        if (!this.phase1) {
            this.crawlToLeft()
        } else if (this.phase1Completed && !this.phase2) {
            this.getUp()
        } else if (this.phase2Completed ) {//&& !this.phase3
            this.launch()
        }
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