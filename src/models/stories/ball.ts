import Matter from "matter-js"
import Story from "@/models/story"
import type Catterpillar from "../catterpillar"
import BallModel from "@/models/ball"

class BallStory extends Story {
    type = "conditional" as const
    catterpillar = undefined as Catterpillar | undefined
    movementCooldown = 0
    cooldown = 1000 // 1 second
    score = 1
    maxBalls = 1
    ball = undefined as BallModel | undefined
    balls: BallModel[] = []
    disableDragging = false
    mousePin = undefined as Matter.Constraint | undefined
    isGrabbed = false
    isLookingAtBall = false
    // isGoingForBall = false
    ballIsFlying = false
    ballIsFlyingTimeout = undefined as NodeJS.Timeout | undefined
    
    resettingEyesTimeout = undefined as NodeJS.Timeout | undefined

    async start() {
        console.info("Ball story started", this.identityStore)

        this.controller.ref.addpointerDownEvent(this.#grabBall.bind(this), "grabBall")
        this.controller.ref.addpointerUpEvent(this.#releaseBall.bind(this), "releaseBall")
        this.controller.ref.addpointerMoveEvent(this.#dragBall.bind(this), "dragBall")

        for (let i = 0; i < this.maxBalls; i++) {
            await this.createBall()
        }

        this.ball = this.balls[0]
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
    }

    #dragBall(pos) {
        if (this.disableDragging) {
            return
        }

        // Move constraint 
        if (this.mousePin) {
            this.mousePin.pointB = pos
        }
    }   

    #ballIsOutOfBounds() {
        if (!this.ball) {
            return false
        }

        if (this.ball.x < 0 ) {

            this.catterpillar.leftEye.lookLeft(2, 4)
            this.catterpillar.rightEye.lookLeft(2, 4)
            return true
        }
        if (this.ball.x > this.controller.ref.renderer.canvas.clientWidth ) {
            this.catterpillar.leftEye.lookRight(2, 4)
            this.catterpillar.rightEye.lookRight(2, 4)
            return true
        }
    }

    async createBall() {
        const size = this.controller.catterpillar.thickness

        const leftSide = this.controller.catterpillar.head.x - this.controller.catterpillar.thickness * 2 - 64
        const rightSide = this.controller.ref.renderer.canvas.clientWidth - this.controller.catterpillar.butt.x - 64
        const x = Math.random() < .5 ? Math.random() * leftSide + 32 : (Math.random() * rightSide) + this.controller.catterpillar.butt.x + 32

        const ball = new BallModel({
            x: x ,
            y: window.innerHeight - this.controller.config.offsetBottom - size *2,
            size: size,
            color: "aquamarine"
        }, this.controller.ref.world)

        await this.actionStore.add(this.identityStore.current.id, "ball", 1)
        this.controller.draw.addBall(ball)
        this.balls.push(ball)
        return ball
    }

    loop() {
        this.catterpillar = this.controller.catterpillar
        const head = this.catterpillar.bodyParts[0].body
        const balls = this.balls
        
        const ball = balls[Math.floor(Math.random() * balls.length)]
        
        if (this.ball?.isMoving) {
            this.isLookingAtBall = true
            this.catterpillar.leftEye.lookAt(ball)
            this.catterpillar.rightEye.lookAt(ball)
        } else {

            if (!this.resettingEyesTimeout) {
                this.resettingEyesTimeout = setTimeout(() => {
                    this.resetEyes()
                    this.resettingEyesTimeout = undefined
                }, 100)
            }
        }

        // Make catterpillar sad if ball is out of bounds
        if (this.#ballIsOutOfBounds()) {
            if (this.catterpillar.mouth.state != "🙁" && !this.resettingEyesTimeout) {
                this.catterpillar.emote("sad")
                
                this.resettingEyesTimeout = setTimeout(() => {
                    this.catterpillar.mouth.moveToState("😐")
                    this.resetEyes()
                }, 8000)
                this.removeBall(this.ball)
            }

        } 


        // Try to move towards ball
        if (balls.length > 0 && !this.catterpillar.isMoving && !this.catterpillar.isTurning && this.movementCooldown <= 0) {
                    
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

        // Remove from world
        this.controller.draw.newObjects = this.controller.draw.newObjects.filter(o => o.id !== ball.composite.id)
        
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
        this.catterpillar.leftEye.lookLeft(0, 2)
        this.catterpillar.rightEye.lookLeft(0, 2)

        this.isLookingAtBall = false

    }
    
    destroy() {
        super.destroy()

        this.controller.ref.removepointerDownEvent("grabBall")
        this.controller.ref.removepointerUpEvent("releaseBall")
        this.controller.ref.removepointerMoveEvent("dragBall")
    }
}

export default BallStory