// import Paper from "paper"
import Matter from "matter-js"
import Color from "@/models/color"

export type BodyPartOptions = {
    size: number,
    stiffness?: number,
    damping?: number,
    slop?: number,
    points?: number,
    restitution?: number,
}


export class BodyPart {
    x: number
    y: number
    radius: number
    body: Matter.Body
    primaryColor:string
    secondaryColor:string
    svgTexture?: string
    hasStroke?: boolean
    options: {
        restitution: number
        slop: number,
    }
    dev: boolean
    type: "bodyPart" | "head" | "butt"
    // paper: paper.Path

    // #generatePaperPath() {
    //     const newPath = new Paper.Path.Circle(new Paper.Point(this.x,this.y), this.radius) 
    //     const primaryColor = new Color(this.primaryColor)
    //     newPath.fillColor = new Paper.Color(primaryColor.toHex())
    //     newPath.strokeColor = new Paper.Color(primaryColor.adjustHsl(0,0,-0.5).toHex())
    //     newPath.strokeColor.alpha = .4
    //     return newPath
    // }

    // #updatePosition() {
    //     this.paper.position.x = this.x
    //     this.paper.position.y = this.y
    // }
    // #updateColor() {
    //     const primaryColor = new Color(this.primaryColor)
    //     this.paper.fillColor = new Paper.Color(primaryColor.toHex())
    //     this.paper.strokeColor = new Paper.Color(primaryColor.adjustHsl(0,0,-0.5).toHex())
    //     this.paper.strokeColor.alpha = .4
    // }

    constructor (
        options: {
            radius: number,
            x?: number,
            y?: number,
            restitution?: number,
            slop?: number,
            primaryColor?: string,
            secondaryColor?: string,
            svgTexture?: string,
            type?: "head" | "butt",
            collisionGroup?: number  // negative for non-colliding
        }
    ) {
        this.dev = true
        this.options = {
            restitution: .5,
            slop: .5,
        }

        this.x = options?.x ? options.x : 0
        this.y = options?.y ? options.y : 0
        this.primaryColor = options?.primaryColor ? options.primaryColor : "#58f208"
        this.radius = options?.radius ? options.radius : 8
        
        // Set label
        this.type = "bodyPart"
        if (options?.type) {
            this.type = options.type
        }
        
        
        if (options?.restitution) {
            this.options.restitution = options.restitution
        }

        if (options?.slop) {
            this.options.slop = options.slop
        }
        
        const label = this.type == "bodyPart" ? "bodyPart" : `bodyPart,${this.type}`

        const group = options?.collisionGroup ? options.collisionGroup : 0

        this.body = Matter.Bodies.circle(this.x, this.y, this.radius/2, { 
            collisionFilter: { group },
            mass: 1,
            density: .2,
            friction: 20,
            restitution: this.options.restitution,
            slop: this.radius/5,
            label,
            render: {
                visible: this.dev,
                fillStyle: this.primaryColor,
                strokeStyle: this.secondaryColor,
                lineWidth: this.hasStroke ? 2 : 0,
            }
        })

        // this.paper = this.#generatePaperPath()

        return new Proxy(this, {
            set: function (target, key, value) {
                // console.log(`${String(key)} set to ${value}`)
                if (key === "x" || key === "y") {
                    target[key] = value
                    // target.#updatePosition()
                }
                if (key === "primaryColor") {
                    target[key] = value
                    // target.#updateColor()
                }
                return true
            }
        }) as BodyPart
    }

    remove() {
        // this.paper.remove()
    }
}

export default BodyPart