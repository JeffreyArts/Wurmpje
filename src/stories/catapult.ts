import Matter from "matter-js"
import Story from "@/stories/_base"
import gsap from "gsap"
import Catterpillar from "@/models/catterpillar"
// import { Catterpillar as CatterpillarModel } from "@/tamagotchi/create/catterpillar"
import BallModel from "@/models/ball"
import { type DBStory } from "@/stores/story"
import { collisionWall, collisionItem } from "@/tamagotchi/collisions"
import { reject } from "lodash"
import Identity, { type IdentityField } from "@/models/identity"
import Leaderboard from "@/models/leaderboard"
import Powerbar from "@/models/powerbar"


class CatapultStory extends Story {
    type = "action" as const
    catterpillar = undefined as Catterpillar | undefined
    ball = undefined as BallModel | undefined
    ballConstraint = undefined as Matter.Constraint | undefined
    score: number = 0
    dbStory = undefined as DBStory | undefined
    
    phase1 = undefined as "inProgress" | "done" | "waiting" |  undefined
    phase2 = undefined as "inProgress" | "done" | undefined
    phase3 = undefined as "inProgress" | "done" | undefined
    phase4 = undefined as "inProgress" | "done" | undefined

    startPosition = undefined as Matter.Vector | undefined
    extraFloor = undefined as  Matter.Body | undefined
    leaderboard = undefined as Leaderboard | undefined
    launcherCatapillers = [] as Array<Catterpillar>
    launchPositions = [] as Array<number>
    
    async start() {
        console.info("Catapult story started", this.identityStore)
        
        this.catterpillar = this.controller.catterpillar

        if (this.catterpillar.speechBubble) {
            this.catterpillar.speechBubble.destroy()
        }

        this.dbStory = await this.storyStore.getLatestDatabaseEntry("catapult")

        await this.actionStore.add(this.identityStore.current.id, "catapult", 1) // register a try, value is irrelevant
    }

    generateLaunchPositions() {
        this.launchPositions = []
        const screenWidth = this.controller.ref.renderer.options.width
        const startPoint = this.controller.ref.renderer.bounds.max.x + 200
        for (let i = 0; i < 5; i++) {
            const startX = startPoint + i * screenWidth * 2
            this.launchPositions.push(startX + Math.random() * screenWidth)
        }
    }

    createCatterpillarLauncher(posX: number) {
        // if (!this.ball) {
        //     return
        // }
        
        const thickness = Math.random() * 8 + 8
        const id = Math.floor(Math.random()*10)
        const identity = {
            id,
            name: `catterpillar-${id}`,
            textureIndex: 0,
            colorSchemeIndex: Math.floor(Math.random() * 32),
            offset: Math.floor(Math.random() * 16),
            gender: Math.random() > 0.5 ? 1 : 0,
            thickness,
            length: Math.floor(Math.random() * 5) + 3,
        } as IdentityField
        const offsetBottom = this.controller.config.offsetBottom ? this.controller.config.offsetBottom : 0
        const position = {  
            x: posX,
            y: this.controller.ref.renderer.canvas.clientHeight - offsetBottom - thickness 
        }

        const textures = [
            { "stroke": false },
            { "stroke": true },
            { "360": "panter","stroke": true },
            { "360": "panter","stroke": true },
            { "360": "cow","stroke": false },
            { "360": "cow","stroke": true },
            { "360": "camo","stroke": false },
            { "360": "camo","stroke": true },]

        const catterPillarOptions =  {
            id: Math.floor(Math.random()*10).toString(),
            x: position.x,
            y: position.y,
            length: identity.length,
            thickness: identity.thickness ,
            primaryColor: "#f90",
            secondaryColor: "#111",
            offset: identity.offset,
            texture: textures[Math.floor(Math.random() * textures.length)],
        }
        
        // Set composite
        const catterpillar = new Catterpillar(catterPillarOptions,  this.controller.ref.world)
        catterpillar.composite.bodies.forEach(body => {
            body.collisionFilter = collisionItem
        })
        this.controller.draw.addCatterpillar(catterpillar)
        this.launcherCatapillers.push(catterpillar)
    }

    loop() {
        if (this.phase1 === undefined) {
            this.startPhase1()
        } else if (this.phase1 === "done" && this.phase2 !== "done") {
            this.startPhase2()
        } else if (this.phase2 === "done" && this.phase3 !== "done") {
            this.startPhase3()
        } else if (this.phase3 === "done" && this.phase4 !== "done") {
            this.cameraFollowBall()
            this.floorFollowBall()
            
            this.generateLauncherLoop()
            this.launcherLoop()

            this.score = this.ball.x - this.catterpillar.x 
            this.startPhase4()
        }
    }

    generateLauncherLoop() {
        if (this.launchPositions.length < 1) {
            this.generateLaunchPositions()
        }   

        this.launchPositions.forEach((position, index) => {
            if (this.ball.x > position - this.controller.ref.renderer.options.width*2) {
                // remove positions from launch array
                this.launchPositions.splice(index, 1)
                // create new catterpillar launcher
                this.createCatterpillarLauncher(position)
            }
        })
    }

    async startPhase1() {
        // Make catterpillar crawl to the left wall for the catapult position

        if (this.phase1 == "inProgress") {
            return
        }
        this.phase1 = "inProgress"

        if (!this.catterpillar) {
            reject(new Error("Catterpillar not defined"))
        }
        
        this.catterpillar.emote("happy")
        
        if (this.catterpillar.isMoving) {
            return
        }

        if (this.catterpillar.head.x < this.catterpillar.length * this.catterpillar.thickness) {
            this.phase1 = "done"
            return
        } 

        try {
            if (this.catterpillar.isPointingLeft()) {
                await this.catterpillar.move()    
            } else {
                await this.catterpillar.turnAround()
            }
        } catch {
            // Try again next loop
            this.phase1 = undefined
            return
        }
            
        if (this.catterpillar.head.x < this.catterpillar.length * this.catterpillar.thickness) {
            this.phase1 = "done"
        } else {
            this.phase1 = undefined
        }
    }

    async startPhase2() {
        // Add ball, extra floor and make catterpillar stand up

        if (this.phase2 == "inProgress") {
            return
        }
        this.phase2 = "inProgress"

        if (!this.catterpillar) {
            reject(new Error("Catterpillar not defined"))
        }

        this.catterpillar.leftEye.lookRight(4,2)
        this.catterpillar.rightEye.lookRight(4,2)
        try {
            await this.catterpillar.standUp()
        } catch {
            // Try again next loop
            this.phase2 = undefined
            return
        }


        await this.createBall()
        this.createExtraFloor()

        this.startPosition = Matter.Vector.create(this.ball.x, this.ball.y)
        this.phase2 = "done"    
    }

    async startPhase3() {
        if (this.phase3 == "inProgress") { 
            return
        }
        this.phase3 = "inProgress"
        document.addEventListener("pointerdown", this.pointerDownEvent.bind(this))
    }


    async startPhase4() {
        if (this.ball.isMoving) {
            return
        }

        if (this.phase4 == "inProgress") {
            return
        }

        this.phase4 = "inProgress"

        this.leaderboard = new Leaderboard("catapult-score", Math.floor(this.score / 10), this.restartStory.bind(this) )

        const rightWall = this.controller.ref.world.bodies.find(body => body.label.includes("wall,right"))
        if (rightWall) {
            rightWall.collisionFilter = collisionWall
        }

    }


    async restartStory() {

        const render = this.controller.ref.renderer
        const width  = render.options.width
        const height = render.options.height
        render.bounds.min.x = 0
        // this.controller.draw.removeObjectById(this.ball.composite.id)

        this.phase1 = "waiting"

        this.actionStore.isSelected = false

        const targetObject = { x: this.ball.x - width / 2, y: 0 }
        let ease = "power1.out"
        if (this.ball.x < width) {
            ease = "power2.out"
        }
        
        gsap.to(targetObject, { x: 0, duration: 1, ease, onUpdate: () => {
            Matter.Render.lookAt(render, {
                min: {
                    x: targetObject.x,
                    y: 0
                },
                max: {
                    x: targetObject.x + width,
                    y: height
                }
            })
        } })

        this.launcherCatapillers.forEach(catterpillar => {
            catterpillar.destroy()
        })

        this.ball.destroy()

        // Update joy
        const joy = Math.min(Math.floor(this.score / 1000), 10)
        await this.actionStore.add(this.identityStore.current.id, "joy", joy)
        gsap.to(this.identityStore.current, { joy: this.identityStore.current.joy + joy, duration: 1 })

        // Remove story from action store
        this.storyStore.killStory("catapult")
        this.actionStore.availableActions -= 1
        this.destroy()
    }

    async pointerDownEvent() {
        if (this.phase3 !== "inProgress") {
            return
        }  
        new Powerbar(this.pointerUpEvent.bind(this))
        
        // Start pulling back the ball
        this.catterpillar.leftEye.pinch(.4)
        this.catterpillar.rightEye.pinch(.4)
        this.catterpillar.emote("hmm")
        // await this.catterpillar.releaseSpine(.1)
        await this.catterpillar.standUp(-70, 1)
    }
            
    async pointerUpEvent(force: number) {
        if (this.phase3 !== "inProgress") {
            return
        }   

        // Start pulling back the ball
        this.catterpillar.leftEye.open(.4)
        this.catterpillar.rightEye.open(.4)
        await this.catterpillar.standUp(0, .05)
        this.launchBall(force)

        this.catterpillar.emote("happy")
        await this.catterpillar.releaseStance()
        setTimeout(() => {
            this.catterpillar.turnAround()
        }, 2000)
    }

    launcherLoop() {
        
        this.launcherCatapillers.forEach(catterpillar => {

            // Check for collision with ball in order to launch it
            if (this.ball.x - this.ball.size/2 < catterpillar.head.x + catterpillar.thickness && 
                this.ball.x + this.ball.size/2 > catterpillar.head.x - catterpillar.thickness &&
                this.ball.y - this.ball.size/2 < catterpillar.head.y + catterpillar.thickness * 2 &&
                this.ball.y + this.ball.size/2 > catterpillar.head.y - catterpillar.thickness * 2
            ) {
                const ball = this.ball.composite.bodies[0]
                const power = catterpillar.length
                const xRandomizer = Math.random() * .8 + .2
                
                catterpillar.standUp(0, .16)
                // Launch the ball via velocity change
                Matter.Body.setVelocity(ball, {
                    x: ball.velocity.x + power * xRandomizer,
                    y: ball.velocity.y + (-(catterpillar.thickness / 2 * power)) / 16
                })
            }


            // Remove launcher catterpillars that are off screen
            if (catterpillar.x < this.controller.ref.renderer.bounds.min.x - 100) {
                this.controller.draw.removeObjectById(catterpillar.composite.id)
                catterpillar.destroy()
                this.launcherCatapillers = reject(this.launcherCatapillers, (c) => c === catterpillar)
                // Remove from array
            }
        })


    }
     
    launchBall(forceMultiplier: number) {
        if (!this.ball || !this.startPosition) {
            return
        }
        
    
        const currentPosition = Matter.Vector.create(this.ball.x, this.ball.y)
        const launchVector = Matter.Vector.sub(this.startPosition, currentPosition)
        const launchMagnitude = Matter.Vector.magnitude(launchVector)
        

        // Limit the maximum launch power
        const maxLaunchPower = 200
        const clampedLaunchPower = Math.min(launchMagnitude, maxLaunchPower)
        // let adjustedLaunchPower = clampedLaunchPower * forceMultiplier
        // Apply force to the ball based on the launch power
        let forceMagnitude = clampedLaunchPower / 1000 // Adjust the multiplier for desired effect
        forceMagnitude *= forceMultiplier
        forceMagnitude *= .5 // tweak down overall power

        const forceVector = Matter.Vector.mult(Matter.Vector.normalise(launchVector), forceMagnitude)

        Matter.Body.applyForce(this.ball.composite.bodies[0], this.ball.composite.bodies[0].position, forceVector)

        // Remove the constraint
        if (this.ballConstraint) {
            Matter.World.remove(this.controller.ref.world, this.ballConstraint)
            this.ballConstraint = undefined
            this.phase3 = "done"
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
                    ballBody.frictionAir += 0.00024
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

        this.extraFloor = Matter.Bodies.rectangle(width/2, height - offsetY + 100, width*20, 200, {
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

        if (this.extraFloor) {
            Matter.World.remove(this.controller.ref.world, this.extraFloor)
        }

        if (this.ball) {
            this.ball.destroy()
            // this.controller.draw.removeObjectById(this.ball.composite.id)
        }
    }
}

export default CatapultStory