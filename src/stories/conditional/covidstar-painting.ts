import Matter from "matter-js"
import Story from "@/stories/_base"
import PaintingModel from "@/models/painting"
import { type DBStory } from "@/stores/story"

class CovidstarPaintingStory extends Story {
    type = "passive" as const
    cooldown = 4 * 7 * 24 * 60 * 60 * 1000 // 4 weeks
    movementCooldown = 0
    painting = undefined as PaintingModel | undefined
    mousePin = undefined as Matter.Constraint | undefined
    disableDragging = false
    isGrabbed = false
    isLookingAtBall = false
    dbStory = undefined as DBStory | undefined
    storyIndex = 0

    paintingIsOutOfBounds = false
    paintingIsFlyingTimeout = undefined as NodeJS.Timeout | undefined
    resetMoveTowardsPointTimeout = undefined as NodeJS.Timeout | undefined
    releasePaintingTimeout = undefined as NodeJS.Timeout | undefined
    resettingEyesTimeout = undefined as NodeJS.Timeout | undefined

    async start() {
        console.info("Covidstar painting story started")

        this.controller.ref.addpointerDownEvent(this.#grabPainting.bind(this), "grabPainting")
        this.controller.ref.addpointerUpEvent(this.#releasePainting.bind(this), "releasePainting")
        this.controller.ref.addpointerMoveEvent(this.#dragPainting.bind(this), "dragPainting")

        this.dbStory = await this.storyStore.getLatestDatabaseEntry("covidstar-painting")
        this.paintingIsOutOfBounds = !!this.dbStory?.details?.outOfBounds || false

        if (!this.paintingIsOutOfBounds) {
            await this.createPainting()
        }
        

        if (typeof this.dbStory?.details?.storyIndex === "number") {
            this.storyIndex = this.dbStory?.details?.storyIndex
        }
    }

    storyAgeInHours() {
        if (!this.dbStory) {
            return Infinity
        }
        
        const ageInMs = Date.now() - this.dbStory.created
        return ageInMs / (1000 * 60 * 60)
    }

    #createMousePin(pinPos: { x: number, y: number }) {
        // Check if pos is inside painting bounds
        const body = this.painting.composite.bodies.find((b) => b.label === "canvas")
        if (!body) {
            return
        }
        
        const bounds = body.bounds  
        if (pinPos.x < bounds.min.x || pinPos.x > bounds.max.x || pinPos.y < bounds.min.y || pinPos.y > bounds.max.y) {
            return
        }

        // Create constraint
        const label = `pinConstraint,painting,${body.id}`
        
        // Get body by name ("painting")
        const pinConstraint = Matter.Constraint.create({
            bodyA: body,
            pointA: { x: pinPos.x - body.position.x, y: pinPos.y - body.position.y },
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
        Matter.Composite.add(this.painting.composite, pinConstraint)
        
        return pinConstraint
    }

    #grabPainting(pos) {
        if (this.disableDragging) {
            return
        }
        
        if (!this.painting) {
            return
        }
        
        this.isGrabbed = true

        if (this.mousePin) {
            this.#releasePainting()
            return
        }
        
        this.mousePin = this.#createMousePin(pos)
    }

    #releasePainting() {
        if (this.disableDragging) {
            return
        }
        // Remove constraint
        if (this.mousePin) {
            if (this.painting) {
                Matter.Composite.remove(this.painting.composite, this.mousePin)
            }
            this.mousePin = undefined
        }

        // Release isGrabbed state
        this.isGrabbed = false
    }

    #dragPainting(pos) {
        if (this.disableDragging) {
            return
        }

        const maxY = this.controller.ref.renderer.canvas.clientHeight - this.controller.config.offsetBottom
        
        // Move constraint 
        if (this.mousePin && pos.y < maxY) {
            this.mousePin.pointB = pos
        }
    }   

    async createPainting() {
        const size = 96

        // const leftSide = this.catterpillar.head.x - this.catterpillar.thickness * 2 - 64
        // const rightSide = this.controller.ref.renderer.canvas.clientWidth - this.catterpillar.butt.x - 64
        // const x = Math.random() < .5 ? Math.random() * leftSide + 32 : (Math.random() * rightSide) + this.catterpillar.butt.x + 32
        // const y = window.innerHeight - this.controller.config.offsetBottom - size *2
        const x = document.body.clientWidth - 80
        const y = 128

        //get current date as DD-MM-YYYY
        const currentDate = new Date() 
        const dd = String(currentDate.getDate()).padStart(2, "0")
        const mm = String(currentDate.getMonth() + 1).padStart(2, "0") //January is 0!
        const yyyy = currentDate.getFullYear()
        const dateString = `${dd}-${mm}-${yyyy}`
        
        this.painting = new PaintingModel({
            x: x,
            y: y,
            width: size,
            height: size + 16, // The 16px is for the text underneath the painting
        }, this.controller.ref.world)
        
        
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size + 16
        const ctx = canvas.getContext("2d")
        // Load painting
        try {
            const imageResponse = await fetch(`${import.meta.env.VITE_PAYLOAD_REST_ENDPOINT}/covid-star/image/${dateString}`, { 
                method: "GET",
            }) 
            if (imageResponse.ok) {
                // Draw white background
                ctx.fillStyle = "#fff"
                ctx.fillRect(0, 0, canvas.width, canvas.height) 
                // Add imageResponse to canvas
                const imageBitmap = await createImageBitmap(await imageResponse.blob())
                ctx.drawImage(imageBitmap, 0, 0, size, size)   
                // Add date text
                ctx.font = "14px \"FixedSys\", sans-serif"
                ctx.fillStyle = "black"
                ctx.textAlign = "center"
                ctx.fillText(dateString, size / 2, size + 10)
                // Invert colors of the canvas
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imageData.data
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i]     // Invert Red
                    data[i + 1] = 255 - data[i + 1] // Invert Green
                    data[i + 2] = 255 - data[i + 2] // Invert Blue
                    // Alpha channel (data[i + 3]) remains unchanged
                }
                ctx.putImageData(imageData, 0, 0)

                // Convert canvas to data URL and set as painting image
                this.painting.image = canvas.toDataURL()        

            }
        } catch (error) {
            console.error("Error fetching covid star image:", error)
        }

        

        this.controller.draw.addPainting(this.painting)
    }

    loop() {
        
    }

    removePainting(painting?: PaintingModel) {
        if (!painting) {
            return
        }
        
        // Remove from draw controller
        this.controller.draw.removeObjectById(painting.composite.id)

        // Remove from Matter world
        Matter.World.remove(this.controller.ref.world, painting.composite)

        // Remove from draw controller
        this.controller.draw.removeObjectById(painting.composite.id)
    }

    destroy() {
        console.info("📕 Ball story finished")

        this.mousePin = undefined
        
        this.removePainting(this.painting)

        if (this.resetMoveTowardsPointTimeout) { clearTimeout(this.resetMoveTowardsPointTimeout) }
        if (this.releasePaintingTimeout) { clearTimeout(this.releasePaintingTimeout) }
        if (this.resettingEyesTimeout) { clearTimeout(this.resettingEyesTimeout) }
        
        
        this.controller.ref.removepointerDownEvent("grabPainting")
        this.controller.ref.removepointerUpEvent("releasePainting")
        this.controller.ref.removepointerMoveEvent("dragPainting")

        // Process the default story destroy
        super.destroy()
    }
}

export default CovidstarPaintingStory