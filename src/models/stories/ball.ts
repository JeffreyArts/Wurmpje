import Matter from "matter-js"
import Story from "@/models/story"
import type Catterpillar from "../catterpillar"
import type { Emote } from "../catterpillar"
import BallModel from "@/models/ball"
import { type DBStory } from "@/stores/story"

class BallStory extends Story {
    type = "conditional" as const
    cooldown = 4 * 7 * 24 * 60 * 60 * 1000 // 4 weeks
    catterpillar = undefined as Catterpillar | undefined
    movementCooldown = 0
    score = 1
    maxBalls = 1
    ball = undefined as BallModel | undefined
    balls: BallModel[] = []
    disableDragging = false
    mousePin = undefined as Matter.Constraint | undefined
    isGrabbed = false
    isLookingAtBall = false
    dbStory = undefined as DBStory | undefined
    storyIndex = 0
    ballIsFlying = false
    ballIsOutOfBounds = false
    ballIsFlyingTimeout = undefined as NodeJS.Timeout | undefined
    resetMoveTowardsPointTimeout = undefined as NodeJS.Timeout | undefined
    releaseBallTimeout = undefined as NodeJS.Timeout | undefined
    
    resettingEyesTimeout = undefined as NodeJS.Timeout | undefined

    async start() {
        console.info("Ball story started", this.identityStore)

        this.controller.ref.addpointerDownEvent(this.#grabBall.bind(this), "grabBall")
        this.controller.ref.addpointerUpEvent(this.#releaseBall.bind(this), "releaseBall")
        this.controller.ref.addpointerMoveEvent(this.#dragBall.bind(this), "dragBall")
        this.catterpillar = this.controller.catterpillar

        this.dbStory = await this.storyStore.getLatestDatabaseEntry("ball")
        this.ballIsOutOfBounds = !!this.dbStory?.details?.outOfBounds || false

        if (!this.ballIsOutOfBounds) {
            for (let i = 0; i < this.maxBalls; i++) {
                await this.createBall()
            }
        }
        

        if (typeof this.dbStory?.details?.storyIndex === "number") {
            this.storyIndex = this.dbStory?.details?.storyIndex
        }



        if (!this.ballIsOutOfBounds) {

            if (this.storyIndex === 0) {
                this.firstMessage()
            }

        } else {
            if (this.storyIndex === 1) {
                if (this.storyAgeInHours() <= 1) {
                    this.backIn1Hour()   
                } else if (this.storyAgeInHours() <= 24) {
                }
            }
            
            if (this.storyAgeInHours() > 1) {
                this.storyStore.completeStory("ball")
            }
        }

    }

    storyAgeInHours() {
        if (!this.dbStory) {
            return Infinity
        }
        
        const ageInMs = Date.now() - this.dbStory.created
        return ageInMs / (1000 * 60 * 60)
    }

    async checkCondition() {
        // Check if story is already completed
        const prevStory = await this.storyStore.getLatestDatabaseEntry("ball")

        // Check if cooldown is set 
        const isCompleted = prevStory && prevStory.cooldown && (Date.now() - prevStory.created) < prevStory.cooldown
        console.log("Ball story completed:", isCompleted)
        if (isCompleted) {
            return false
        }

        if (this.identityStore.current.age < 3) {
            return false
        }

        return true
    }

    #createMousePin(pinPos) {
        let inReach = false
        // Get distance from pinPos to ball center
        this.balls.forEach(ball => {
            const dx = pinPos.x - ball.x
            const dy = pinPos.y - ball.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < ball.size) {
                this.ball = ball
                inReach = true
            }
        })

        if (!inReach) {
            return undefined
        }

        // Create constraint
        const label = `pinConstraint,ball,${this.ball?.composite.bodies[0].id}`
        
        const pinConstraint = Matter.Constraint.create({
            bodyA: this.ball.composite.bodies[0],
            pointB: { x: pinPos.x, y: pinPos.y },
            length: 0,
            stiffness: .18,
            damping: 1,
            label,
            render: {
                strokeStyle: "blue",
                type: "line",
            }
        })
        Matter.Composite.add(this.ball.composite, pinConstraint)
        
        return pinConstraint
    }

    #grabBall(pos) {
        if (this.disableDragging) {
            return
        }
        this.isGrabbed = true

        if (this.mousePin) {
            this.#releaseBall()
            return
        }
        
        this.mousePin = this.#createMousePin(pos)
    }

    #releaseBall() {
        if (this.disableDragging) {
            return
        }
        // Remove constraint
        if (this.mousePin) {
            Matter.Composite.remove(this.ball.composite, this.mousePin)
            this.mousePin = undefined
        }

        // Release isGrabbed state
        this.isGrabbed = false

        // Make catterpillar move to ball
        this.releaseBallTimeout = setTimeout(() => {
            this.catterpillar.emote("happy")
            this.makeCatterpillarMoveToBall()
        }, 500)
    }

    #dragBall(pos) {
        if (this.disableDragging) {
            return
        }

        const maxY = this.controller.ref.renderer.canvas.clientHeight - this.controller.config.offsetBottom
        
        // Move constraint 
        if (this.mousePin && pos.y < maxY) {
            this.mousePin.pointB = pos
        }
    }   

    #ballIsOutOfBounds() {
        if (!this.ball) {
            return false
        }

        this.ballIsOutOfBounds = false

        if (this.ball.x < 0 ) {
            this.catterpillar.leftEye.lookLeft(2, 4)
            this.catterpillar.rightEye.lookLeft(2, 4)
            this.ballIsOutOfBounds = true
        } else if (this.ball.x > this.controller.ref.renderer.canvas.clientWidth ) {
            this.catterpillar.leftEye.lookRight(2, 4)
            this.catterpillar.rightEye.lookRight(2, 4)
            this.ballIsOutOfBounds = true
        } else if (this.ball.y > this.controller.ref.renderer.canvas.clientHeight ) {
            this.catterpillar.leftEye.lookDown(2, 4)
            this.catterpillar.rightEye.lookDown(2, 4)
            this.ballIsOutOfBounds = true
        }

        this.storyStore.updateStoryDetails("ball", { outOfBounds: this.ballIsOutOfBounds })

        return this.ballIsOutOfBounds
    }

    async createBall() {
        const size = this.catterpillar.thickness

        const leftSide = this.catterpillar.head.x - this.catterpillar.thickness * 2 - 64
        const rightSide = this.controller.ref.renderer.canvas.clientWidth - this.catterpillar.butt.x - 64
        const x = Math.random() < .5 ? Math.random() * leftSide + 32 : (Math.random() * rightSide) + this.catterpillar.butt.x + 32

        const ball = new BallModel({
            x: x ,
            y: window.innerHeight - this.controller.config.offsetBottom - size *2,
            size: size,
            color: "aquamarine"
        }, this.controller.ref.world)

        await this.actionStore.add(this.identityStore.current.id, "ball", this.balls.length)

        // Load last 4 joy actions
        const lastActions = await this.actionStore.loadLastActionsFromDB(this.identityStore.current.id, "joy", 10)
        lastActions.sort((a, b) => b.created - a.created)
        const lastAction = lastActions.find(action => {
            // Check for action that is within the last day and has the value of 5
            if (action.value == 5 && (Date.now() - action.created) < 24 * 60 * 60 * 1000) {
                return true
            }
        })
        if (!lastAction) {
            await this.actionStore.add(this.identityStore.current.id, "joy", 5)
            this.identityStore.current.joy += 5
        }
        
        this.controller.draw.addBall(ball)
        this.balls.push(ball)
        this.ball = this.balls[0]
        return ball
    }

    loop() {
        this.catterpillar = this.catterpillar
        const head = this.catterpillar.bodyParts[0].body
        const balls = this.balls
        
        const ball = balls[Math.floor(Math.random() * balls.length)]
        
        // Look at ball when it is moving
        if (this.ball?.isMoving) {
            this.isLookingAtBall = true
            this.catterpillar.leftEye.lookAt(ball)
            this.catterpillar.rightEye.lookAt(ball)
        } else {
        // Reset eyes after a short delay when ball movement has stopped
            if (!this.resettingEyesTimeout) {
                this.resettingEyesTimeout = setTimeout(() => {
                    if (!this.catterpillar.isMoving) {
                        this.resetEyes()
                    }
                    this.resettingEyesTimeout = undefined
                }, 100)
            }
        }
        
        // Make catterpillar sad if ball is out of bounds
        if (this.#ballIsOutOfBounds() && this.ball) {
            this.catterpillar.moveTowardsPoint = null
            this.removeBall(this.ball)

            if (this.resettingEyesTimeout) {
                clearTimeout(this.resettingEyesTimeout)
            }
            
            if (this.releaseBallTimeout) {
                clearTimeout(this.releaseBallTimeout)
            }

            this.messageOutOfBounds()

            if (this.catterpillar.mouth.state != "🙁") {
                this.catterpillar.emote("sad")
                this.resettingEyesTimeout = setTimeout(() => {
                    this.catterpillar.mouth.moveToState("😐")
                    this.resetEyes()
                }, 8000)
            }
        } 

        if (this.ball && (this.ball.x < this.ball.size*3 || this.ball.x > this.controller.ref.renderer.canvas.clientWidth - this.ball.size*3)) {
            this.catterpillar.moveTowardsPoint = null
        }

        // console.log(Math.abs(this.catterpillar.moveTowardsPoint.x - this.catterpillar.head.x) < (this.catterpillar.thickness + this.ball.size) * 1.5)
        // Stop moving towards ball when head is close to the ball
        if (this.catterpillar.moveTowardsPoint && Math.abs(this.catterpillar.moveTowardsPoint?.x - this.catterpillar.head.x) < (this.catterpillar.thickness + this.ball.size)) {
            if (this.resetMoveTowardsPointTimeout) {
                clearTimeout(this.resetMoveTowardsPointTimeout)
            }
            
            this.resetMoveTowardsPointTimeout = setTimeout(() => {
                if (this.catterpillar.moveTowardsPoint && Math.abs(this.catterpillar.moveTowardsPoint?.x - this.catterpillar.head.x) < (this.catterpillar.thickness + this.ball.size)) {
                    this.catterpillar.moveTowardsPoint = null
                }
            }, 200)
        }

        // Try to move towards ball
        if (!this.ballIsOutOfBounds && 
            balls.length > 0 &&
            !this.catterpillar.isMoving &&
            !this.catterpillar.isTurning &&
            this.movementCooldown <= 0) {
                    
            if (ball.x < head.position.x) {
                if (!this.catterpillar.isPointingLeft()) {
                    this.catterpillar.turnAround()
                } else {
                    this.catterpillar.move()
                }
            } else {
                if (this.catterpillar.isPointingLeft()) {
                    this.catterpillar.turnAround()
                } else {
                    this.catterpillar.move()
                }
            }
            this.movementCooldown = 800 + Math.floor(Math.random() * 400)
        }
        
        
        this.movementCooldown -= 1
    }

    removeBall(ball: BallModel) {
        if (!ball) {
            return
        }
        
        // Remove from array
        this.balls = this.balls.filter(b => b !== ball)

        // Remove ball
        this.ball = this.balls[0]

        // Remove from draw controller
        this.controller.draw.removeObjectById(ball.composite.id)

        // Remove from Matter world
        Matter.World.remove(this.controller.ref.world, ball.composite)
    }

    resetEyes() {   
        if (!this.isLookingAtBall) {
            return
        }
        console.log("Resetting eyes")

        this.catterpillar.leftEye.blink()
        this.catterpillar.rightEye.blink()
        this.catterpillar.leftEye.lookLeft(2, 2)
        this.catterpillar.rightEye.lookLeft(2, 2)

        this.isLookingAtBall = false

    }

    firstMessage() {
        const messages = [
            "Look, a ball!"
        ]
        const message = messages[Math.floor(Math.random() * messages.length)]
        
        this.catterpillar.leftEye.lookAt(this.ball)
        this.catterpillar.rightEye.lookAt(this.ball)
        setTimeout(async () => {
            this.catterpillar.emote("happy")
            await this.catterpillar.say(message)
            
            setTimeout(() => {
                this.controller.catterpillar.speechBubble?.remove()
            }, 3200)
            this.makeCatterpillarMoveToBall()
        }, 500)

        this.storyStore.updateStoryDetails("ball", { storyIndex: 1 })
    }

    backIn1Hour() {
        const messages = [
            "They threw it back!",
            "Happy to see someone returned my ball!",
            "Yay! My ball is back!",
        ]
        const message = messages[Math.floor(Math.random() * messages.length)]
        
        this.createBall()

        if (this.resettingEyesTimeout) {
            clearTimeout(this.resettingEyesTimeout)
        }


        this.isLookingAtBall = true
        
        this.catterpillar.leftEye.lookAt(this.ball)
        this.catterpillar.rightEye.lookAt(this.ball)

        
        setTimeout(async () => {
            this.catterpillar.emote("happy")
            await this.catterpillar.say(message)

            setTimeout(() => {
                this.controller.catterpillar.speechBubble?.remove()
                this.resettingEyesTimeout = undefined
            }, 3200)
            this.makeCatterpillarMoveToBall()
        }, 500)
    }

    messageOutOfBounds() {
        if (!this.ballIsOutOfBounds) {
            return
        }
        let messages = []
        let emoteState = "sad" as Emote
        let joyValue = -15
        
        if (this.storyAgeInHours() <= 1) {
            messages = [
                "Oh no! My ball is gone!",
                "Why did you do that? 😭",
                "Hope they will throw it back...",
            ]
        } else if (this.storyAgeInHours() <= 24) {
            messages = [
                "Why did you do that!",
                "Why can't you do normal!?",
                "That was my favorite! 😢",
            ]
            joyValue = -10
        }  else if (this.storyAgeInHours() <= 24 * 7) {
            messages = [
                "That's to bad",
                "Well... That was bound to happen...",
                "Well.. At least it was fun while it lasted"
            ]
            joyValue = -5
        }  else {
            messages = [
                "That was bound to happen... 🙈",
                "Well.. That was fun"
            ]
            joyValue = -1
            emoteState = "happy"
        } 

        // Decrease joy
        this.identityStore.current.joy += joyValue
        this.actionStore.add(this.identityStore.current.id, "joy", joyValue)
        

        const message = messages[Math.floor(Math.random() * messages.length)]
        this.catterpillar.say(message)   
        this.catterpillar.emote(emoteState)
    }


    makeCatterpillarMoveToBall() {
        this.catterpillar.moveTowards(this.ball)
    }
    
    destroy() {
        super.destroy()

        this.controller.ref.removepointerDownEvent("grabBall")
        this.controller.ref.removepointerUpEvent("releaseBall")
        this.controller.ref.removepointerMoveEvent("dragBall")
    }
}

export default BallStory