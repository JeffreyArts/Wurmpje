import _ from "lodash"
import Matter from "matter-js"
import Paper from "paper"
import gsap from "gsap"

export type SpeechBubbleOptions = {
    x?: number
    y?: number
    text?: string
} 

interface SpeechBubble {
    anchor: {
        width: number,
        height: number
    }
    bubble: {
        left: Matter.Composite,
        right: Matter.Composite,
        anchor: Matter.Composite,
        outline: Array<{paper: paper.Point, matter: Matter.Body}>
    }
    size: number
    parentElement: HTMLElement
    paperJS: paper.Path
    x: number,
    y: number,
    death: boolean,
    text: string
    domElement: HTMLDivElement
    composite: Matter.Composite
    world: Matter.World
}

class SpeechBubble  {

    #createDomElement (text: string) {
        const domElement = document.createElement("div")
        if (this.parentElement) {
            this.parentElement.appendChild(domElement)
        }
        domElement.classList.add("speech-bubble")
        domElement.innerText = text
        domElement.style.position = "absolute"
        domElement.style.transform = "translateY(-50%)"
        domElement.style.left = this.x + "px"
        domElement.style.top = this.y + "px"
        return domElement
    }


    #createCircle (x: number, y: number, angles: Array<number>) {
        const res = Matter.Composite.create({})
        if (this.size != this.domElement.clientHeight) {
            gsap.to(this, {
                size: this.domElement.clientHeight,
                duration: .32
            })
        }
        const centerPoint = Matter.Bodies.circle(x,y, 5, {
            label: "centerPoint",
            isStatic: true
        })

        Matter.Composite.add(res, [centerPoint])
        _.each(angles, angle => {
            const borderX = x + Math.cos(angle * Math.PI/180) * this.size
            const borderY = y + Math.sin(angle * Math.PI/180) * this.size

            const borderPoint = Matter.Bodies.circle(
                borderX,
                borderY,
                2, 
                {
                    label: `borderPoint-${angle}`,
                    isStatic: false,
                    collisionFilter: {
                        group: -1,
                        category: 1,
                        mask: 0
                    }
                }
            )

            const constraint = Matter.Constraint.create({
                bodyA: centerPoint,
                bodyB: borderPoint,
                length: this.size,
                stiffness: .048,
                damping: .6,
                render: {
                    lineWidth: 1,
                    type: "line"
                }
            })  
            this.paperJS.add(new Paper.Point({x: borderX, y: borderY}))
            Matter.Composite.add(res, [borderPoint, constraint])
        })

        // const Path = new Paper.Path(this.imgBlob.points)
        // Path.closed = true

        // if (this.options.smooth) {
        //     Path.smooth()
        // }

        return res
    }
    
    #createAnchor () {
        if (!this.bubble.left || this.bubble.left.bodies.length <= 0) {
            throw new Error("First create bubble with createBubble function")
        }
        const res = Matter.Composite.create({
            label: "anchor"
        })

        const pointA = this.bubble.left.bodies[1]
        const pointB = this.bubble.left.bodies[2]
        
        
        const centerPoint = Matter.Bodies.circle(this.x,this.y, 5, {
            label: "anchorPoint",
            isStatic: true
        })
        const constraintA = Matter.Constraint.create({
            bodyA: centerPoint,
            bodyB: pointA,
            stiffness: 0.02,
            damping: 0.02,
            render: {
                strokeStyle: "#9f0",
                type: "line"
            }
        })
        const constraintB = Matter.Constraint.create({
            bodyA: centerPoint,
            bodyB: pointB,
            stiffness: 0.02,
            damping: 0.02,
            render: {
                strokeStyle: "#9f0",
                type: "line"
            }
        })

        Matter.Composite.add(res,[centerPoint, constraintA, constraintB])

        return res
    }
    #createBubble (x: number, y: number) {
        const bgc = "#F8FADB"
        
        this.paperJS =  new Paper.Path({
            fillColor: bgc,
        })
        this.bubble = {
            left: this.#createCircle(x,y - this.anchor.height - this.size / 2, [90, 135, 180, 225, 270]),
            right: this.#createCircle(x + this.domElement.clientWidth,y - this.anchor.height - this.size / 2, [270, 315, 0, 45, 90]),
            anchor: Matter.Composite.create({label: "false"}),
            outline: []
        }
        
        this.composite = Matter.Composite.create({
            composites: [this.bubble.left, this.bubble.right],
            label: "speechBubble",
        })
        
        this.bubble.anchor = this.#createAnchor(),
        Matter.Composite.add(this.composite, this.bubble.anchor)
        
        const leftTop = _.find(this.bubble.left.bodies, {label: "borderPoint-270"})
        const rightTop = _.find(this.bubble.right.bodies, {label: "borderPoint-270"})
        const leftBottom = _.find(this.bubble.left.bodies, {label: "borderPoint-90"})
        const rightBottom = _.find(this.bubble.right.bodies, {label: "borderPoint-90"})

        if (leftTop && leftBottom) {
            const leftConstraint = Matter.Constraint.create({
                label: "leftConstraint",
                bodyA: leftTop,
                bodyB: leftBottom,
                stiffness: .024,
                length: this.size,
                render: {
                    lineWidth: 4,
                    strokeStyle: "#09f"
                }
            })
            Matter.Composite.add(this.composite, leftConstraint)
        }

        if (rightTop && rightBottom) {
            const rightConstraint = Matter.Constraint.create({
                label: "rightConstraint",
                bodyA: rightTop,
                bodyB: rightBottom,
                stiffness: .024,
                length: this.size,
                render: {
                    lineWidth: 4,
                    strokeStyle: "#09f"
                }
            })
            Matter.Composite.add(this.composite, rightConstraint)
        }


        this.domElement.style.left = (this.x + this.anchor.width) + "px"
        this.domElement.style.top = (this.y - this.anchor.height - this.size / 2) + "px"

        // this.paperJS.closePath()
        this.paperJS.smooth({ type: "geometric"})
        return this.bubble
    }

    

    #draw() {
        if (this.death){ 
            return
        }

        const leftSide = _.filter(this.bubble.left.bodies, body => body.label.startsWith("borderPoint"))
        const rightSide = _.filter(this.bubble.right.bodies, body => body.label.startsWith("borderPoint"))
        const points = _.union(leftSide,rightSide)
        
        const anchor = _.find(this.bubble.anchor.bodies, {label: "anchorPoint"})

        if (anchor) {
            const lastIndex = this.paperJS.segments.length -1
            this.paperJS.segments[0].point.x = anchor.position.x
            this.paperJS.segments[0].point.y = anchor.position.y

            this.paperJS.segments[lastIndex].point.x = points[0].position.x
            this.paperJS.segments[lastIndex].point.y = points[0].position.y

        }

        for (let index = 1; index < points.length - 1; index++) {
            const body = points[index]
            this.paperJS.segments[index].point.x = body.position.x
            this.paperJS.segments[index].point.y = body.position.y    
        }

        this.paperJS.smooth({ type: "geometric"})
        
        requestAnimationFrame(() => this.#draw())
    }
    #updateTextPosition() {
        const leftTop = _.find(this.bubble.left.bodies, {label: "borderPoint-270"})
        const leftBottom = _.find(this.bubble.left.bodies, {label: "borderPoint-90"})
        
        if (leftTop && leftBottom) {
            const x = leftTop.position.x
            const y = Math.abs(leftTop.position.y + leftBottom.position.y)/2
            this.domElement.style.top = y + "px"
            this.domElement.style.left = x + "px"
        }
    }
    #updateSize() {
        const topConstraint = _.find(this.composite.constraints, {label: "topConstraint"})
        const leftConstraint = _.find(this.composite.constraints, {label: "leftConstraint"})
        const rightConstraint = _.find(this.composite.constraints, {label: "rightConstraint"})
        
        if (topConstraint) {
            topConstraint.length = this.domElement.clientWidth
        }

        if (leftConstraint) {
            leftConstraint.length = this.size
        }

        if (rightConstraint) {
            rightConstraint.length = this.size
        }

        _.each(this.bubble.left.constraints, constraint => {
            constraint.length = this.size/2
        })

        _.each(this.bubble.right.constraints, constraint => {
            constraint.length = this.size/2
        })
    }

    #loop(){
        if (this.death){ 
            return
        }
        const borderPointsLeft = _.filter(this.composite.composites[0].bodies, body => {
            return body.label.startsWith("borderPoint")
        })
        const borderPointsRight = _.filter(this.composite.composites[1].bodies, body => {
            return body.label.startsWith("borderPoint")
        })
        
        
        _.each(borderPointsLeft, this.#pushBorderPoint)
        _.each(borderPointsRight, this.#pushBorderPoint)
        this.#updateSize()
        this.#updateTextPosition()

        requestAnimationFrame(() => this.#loop())
    }
    
    #pushBorderPoint(body: Matter.Body) {
        const force = 3.6
        const angle = parseInt(body.label.split("-")[1], 10)
        if (!angle && angle !== 0) {
            throw new Error("Border point must have angle specified in label name eg. borderPoint-90 for 90 degrees")
        }
        const x = Math.cos(angle * Math.PI/180) * force
        const y = Math.sin(angle * Math.PI/180) * force
        Matter.Body.setVelocity(body, Matter.Vector.create(x,y))
    }

    constructor (
        world: Matter.World,
        parentElement: HTMLElement,
        options = {
            x: 128,
            y: 122,
            text: "..."
        } as SpeechBubbleOptions) {
        this.death = false
        this.world = world
        this.text = options.text ? options.text : "..."
        this.parentElement = parentElement
        this.anchor = {
            width: 20,
            height: 22
        }
        if (!options.x) {
            options.x = 128
        }
        if (!options.y) {
            options.y = 128
        }
        
        this.x = options.x
        this.y = options.y
        this.domElement = this.#createDomElement(this.text)
        this.size = this.domElement.clientHeight

        this.#createBubble(this.x, this.y)
        setTimeout(() => {
            this.updatePosition()
        })
        this.#draw()
        this.#loop()
            
        return new Proxy(this, {
            set: function (target: SpeechBubble, key, value) {
                if (key === "x" || key === "y") {
                    target[key] = value
                    target.updatePosition()
                }

                if (key === "text") {
                    target[key] = value
                    target.updateText()
                }

                return true
            }
        })
    }

    updateText() {
        if (!this.domElement) {
            console.warn("Missing domElement", this.death)
            return
        }
        this.domElement.innerText = this.text
        const rightSide = _.find(this.bubble.right.bodies, {label: "centerPoint"})
        if (this.size != this.domElement.clientHeight) {
            gsap.to(this, {
                size: this.domElement.clientHeight,
                duration: .32
            })
        }

        if (rightSide) {
            rightSide.position.x = this.x + this.domElement.clientWidth
        }
        this.updatePosition()
    }
    updatePosition(instant = false) {
        let duration = 0
        if (!instant) {
            duration = .64
        }

        const cpLeft = _.find(this.bubble.left.bodies, {label: "centerPoint"})
        const cpRight = _.find(this.bubble.right.bodies, {label: "centerPoint"})
        const anchor = _.find(this.bubble.anchor.bodies, {label: "anchorPoint"})
        if (cpLeft) {
            gsap.to(cpLeft.position, {
                x: this.x + this.anchor.width,
                y: this.y - this.anchor.height - this.size /2,
                duration: duration,
                onComplete: () => {
                    this.updateText()
                }
            })
        }
        
        if (cpRight) {
            gsap.to(cpRight.position, {
                x: this.x + this.domElement.clientWidth + this.anchor.width,
                y: this.y - this.anchor.height - this.size/2,
                duration: duration,
            })
        }

        if (anchor) {
            gsap.to(anchor.position, {
                x: this.x,
                y: this.y,
                duration: duration,
            })
        }
    }

    remove() {
        this.text = ""
        this.death = true
        Matter.Composite.remove(this.world, this.composite)
        this.domElement.remove()
    }

}

export default SpeechBubble