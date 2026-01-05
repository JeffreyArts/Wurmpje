import Matter from "matter-js"
import Story from "@/models/story"
import type Catterpillar from "../catterpillar"
import type { Draw } from "@/tamagotchi/draw"
import FoodModel from "@/models/food"
import gsap from "gsap"

class EatStory extends Story {
    catterpillar = undefined as Catterpillar | undefined
    movementCooldown = 0
    cooldown = 1000 // 1 second
    score = 1
    activeFood = []
    turnsWithoutFood = 0
    foodIndex = 0
    draw = undefined as Draw | undefined
    start() {
        console.info("Eat story started", this.identityStore)

        this.draw = this.controller.draw

        this.controller.ref.addClickEvent(this.addFood.bind(this), "addFood")
        
    }

    async addFood(position: { x: number, y: number }) {
        // Do nothing if action is not selected
        if (!this.actionStore.isSelected) {
            return
        }
        
        if (this.actionStore.availableActions <= 0) {
            this.storyStore.killStory("eat")
            return
        }
        
        if (position.y > this.controller.ref.renderer.options.height - this.controller.config.offsetBottom) {
            return
        }
        
        const size = this.catterpillar.thickness
        const food = new FoodModel({
            x: position.x,
            y: position.y,
            size: size,
            color: "aquamarine"
        }, this.controller.ref.world)

        this.movementCooldown = 120
        await this.actionStore.add(this.identityStore.current.id, "food", 10)
        await this.actionStore.loadAvailableFood(this.identityStore.current.id)
        this.draw.addFood(food)
        this.activeFood.push(food)

        if (this.actionStore.availableActions <= 0) {
            // This meot nog ff gefixed worden. Is om de matter-box te laten weten dat er geen food meer is
            // this.actionActive = false
            this.actionStore.isSelected = false

            this.controller.switchClickEvent("none")
            this.controller.ref.removeClickEvent( "addFood")
        }
    }

    loop() {
        this.catterpillar = this.controller.catterpillar
        const head = this.catterpillar.bodyParts[0].body
        const foods = this.activeFood
        
        const food = foods[this.foodIndex]
        
        if (food) {
            this.catterpillar.leftEye.lookAt(food)
            this.catterpillar.rightEye.lookAt(food)
        } else {
            this.foodIndex = 0
            this.turnsWithoutFood = 0
        }
                
        if (this.turnsWithoutFood > 4) {
            this.foodIndex++
            this.turnsWithoutFood = 0
        }
        
        // Try to move towards first food
        if (foods.length > 0 && !this.catterpillar.isMoving && !this.catterpillar.isTurning && this.movementCooldown <= 0) {
                    
            if (food.x < head.position.x) {
                if (!this.catterpillar.isPointingLeft()) {
                    this.catterpillar.turnAround()
                    this.turnsWithoutFood++
                } else {
                    this.catterpillar.move()
                }
            } else {
                if (this.catterpillar.isPointingLeft()) {
                    this.catterpillar.turnAround()
                    this.turnsWithoutFood++
                } else {
                    this.catterpillar.move()
                }
            }
            this.movementCooldown = 80 + Math.floor(Math.random() * 40)
        }
        
        
        // Loop through foods and consume if close to head
        foods.forEach(food => {
            const distance = Math.hypot(head.position.x - food.x, head.position.y - food.y)
            if (distance < this.catterpillar.thickness) {
                // Eat the food

                this.consumeFood(food)
            }
        })
        
        this.movementCooldown -= 1
    }
    
    consumeFood(food: FoodModel) {
        const foodBody = food.composite.bodies[0]
        
        this.catterpillar.mouth.chew(5)
        
        // Move food into catterpillar mouth with a setVelocity and rotation
        setTimeout(() => {
            Matter.Body.setVelocity(foodBody, {
                x: 0,
                y: 3,
            })
            Matter.Body.setAngularVelocity(foodBody, 2)
        }, 240)
        
        // fade out food
        const drawObject = this.draw.newObjects.find(o => o.id.toString() === food.composite.id.toString())
        if (drawObject) {
            for (const layer in drawObject.layers) {
                const svg = drawObject.layers[layer][0].svg
                gsap.to(svg, { 
                    opacity: 0,
                    duration: 1,
                    onComplete: () => {
                        this.draw.newObjects = this.draw.newObjects.filter(o => o.id.toString() !== food.composite.id.toString())
                        Matter.Composite.remove(this.controller.ref.world, food.composite)
                    } 
                })
        
                gsap.to(this.identityStore.current, {
                    hunger: this.identityStore.current.hunger + 10,
                    duration: 1,
                    ease: "power1.out",
                })
            }
        }

        // Remove food from active foods
        const index = this.activeFood.indexOf(food)
        if (index > -1) {
            this.activeFood.splice(index, 1)
        }

        // Make catterpillar look forward again
        if (this.catterpillar.isPointingLeft()) {
            this.catterpillar.leftEye.lookLeft(undefined, 1)
            this.catterpillar.rightEye.lookLeft(undefined, 1)
        } else {
            this.catterpillar.leftEye.lookRight(undefined, 1)
            this.catterpillar.rightEye.lookRight(undefined, 1)
        }
         
    }

    destroy() {
        super.destroy()
        this.controller.ref.removeClickEvent( "addFood")
    }
}

export default EatStory