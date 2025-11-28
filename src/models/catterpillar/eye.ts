// import Paper from "paper"
import gsap from "gsap"
import { Point, Path } from "@/models/path"

export type EyeOptions = {
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    autoBlink?: boolean,
    blinkInterval?: number 
}

export class Eye  {
    x: number
    y: number
    offset: {
        x: number
        y: number
    }
    width: number
    height: number
    pupil: Point
   
    
    constructor (
        options: EyeOptions
    ) {
        this.x = options.x ? options.x : 0
        this.y = options.y ? options.y : 0
        this.width = options.width ? options.width : 8
        this.height = options.height ? options.height : 8
        this.pupil = new Point(this.x, this.y)
    }
 

    // angle in degrees
    // distance in pixels
    // duration in seconds
    look(angle: number, distance: number, duration?: number) {
        const rad = angle * (Math.PI / 180)
        const x = Math.cos(rad) * distance
        const y = Math.sin(rad) * distance

        gsap.to(this.pupil, {
            x: this.x + x,
            y: this.y + y,
            duration: duration ? duration : 0.2,
            ease: "power2.out"
        })
    }
    
    lookLeft(distance: number) {
        this.look(180, distance)
    }

    lookRight(distance: number) {
        this.look(0, distance)
    }

    lookUp(distance: number) {
        this.look(270, distance)
    }

    lookDown(distance: number) {
        this.look(90, distance)
    }
}

export default Eye