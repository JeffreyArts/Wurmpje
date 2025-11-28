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
    section: "bodyPart" | "head" | "butt"
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
            section?: string
        }
    ) {
        this.options = {
            restitution: 1,
            slop: 1,
        }

        this.section = "bodyPart"
        this.x = options?.x ? options.x : 0
        this.y = options?.y ? options.y : 0
        this.primaryColor = options?.primaryColor ? options.primaryColor : "#58f208"
        this.radius = options?.radius ? options.radius : 8

        if (options?.restitution) {
            this.options.restitution = options.restitution
        }

        if (options?.slop) {
            this.options.slop = options.slop
        }
        
        this.body = Matter.Bodies.circle(this.x, this.y, this.radius/2, { 
            collisionFilter: { 
                category: 0x0002,
            }, 
            mass: 1,
            density: .2,
            friction: .1,
            restitution: this.options.restitution,
            slop: this.options.slop ? this.options.slop : this.radius/5,
            label: this.section
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