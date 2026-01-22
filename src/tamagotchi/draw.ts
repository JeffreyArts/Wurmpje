// @ts-nocheck
import CatterpillarModel from "@/models/catterpillar"
import Chroma from "chroma-js"
import Two from "two.js"
import { reverse } from "lodash"

import { Eye } from "@/models/catterpillar/eye"
import { Mouth } from "@/models/catterpillar/mouth"


export const availableBodyPartTextures = [
    "/bodyparts/360/camo",
    "/bodyparts/360/cow",
    "/bodyparts/360/dots",
    "/bodyparts/360/giraffe",
    "/bodyparts/360/leafs",
    "/bodyparts/360/panter",
    "/bodyparts/360/paths",
    "/bodyparts/360/worms",
    "/bodyparts/bottom/b1",
    "/bodyparts/bottom/b2",
    "/bodyparts/bottom/b3",
    "/bodyparts/bottom/b4",
    "/bodyparts/bottom/b5",
    "/bodyparts/bottom/b6",
    "/bodyparts/bottom/b7",
    "/bodyparts/bottom/b8",
    "/bodyparts/top/t1",
    "/bodyparts/top/t2",
    "/bodyparts/top/t3",
    "/bodyparts/top/t4",
    "/bodyparts/top/t5",
    "/bodyparts/top/t6",
    "/bodyparts/top/t7",
    "/bodyparts/top/t8",
    "/bodyparts/top/t9",
    "/bodyparts/top/t10",
    "/bodyparts/vert/v1",
    "/bodyparts/vert/v2",
    "/bodyparts/vert/v3",
    "/bodyparts/vert/v4",
    "/bodyparts/vert/v5",
    "/bodyparts/vert/v6",
    "/bodyparts/vert/polkadots",
]
type objectModel = {
    id: number,
    type: "food" | "catterpillar" | "speechBubble" | "ball" | "plank",
    model: FoodModel | CatterpillarModel | SpeechBubble | BallModel | PlankModel,
    layers: Layers
}

type EyeGroup = Two.Group & {
    pupil: Two.Circle
    lid: Two.Path
}

type Layers = {
    [key: number]: Two.Shape[] | Two.Shape; // key = laagnummer, value = array van Two.Shape
}

export class Draw {
    two: Two
    objects: Array<{ shape: Two.Shape, pos: { x: number, y: number }, updateVertices?: () => Array<{ x: number, y: number }> }> = []
    layers: Two.Group[] = []
    newObjects: Array<objectModel> = []
    renderer?: Matter.Render | undefined

    constructor(two: Two, renderer?: Matter.Render) {
        this.two = two
        this.renderer = renderer
        for (let i = 0; i < 16; i++) {
            const layer = this.two.makeGroup() as Two.Group
            layer.name = `layer-${i}`
            this.layers.push(layer)
            this.two.add(layer)
        }
        requestAnimationFrame(this.#draw.bind(this))
    }

    #draw() {
        this.two.update()
        if (this.renderer) {
            
            const bounds = this.renderer.bounds

            this.two.scene.translation.set(
                -bounds.min.x,
                -bounds.min.y
            )

        }

        this.newObjects.forEach(obj => {
            if (obj.type == "food") {
                this.drawFood(obj)
            } else if (obj.type == "ball") {
                if (!this.drawBall(obj))  {
                    this.removeBall(obj)
                    this.newObjects = this.newObjects.filter(o => o.id !== obj.id)
                }
            } else if (obj.type == "plank") {
                this.drawPlank(obj)
            } else if (obj.type == "catterpillar") {
                if (!this.drawCatterpillar(obj)) {
                    this.removeCatterpillar(obj)
                    this.newObjects = this.newObjects.filter(o => o.id !== obj.id)
                }
            }
        })
        
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i]

            obj.shape.position.set(obj.pos.x, obj.pos.y)

            if (obj.updateVertices) {
                const verts = obj.updateVertices()
                
                if (!verts) {
                    obj.shape.remove()          // 1. uit Two.js scene halen
                    this.objects.splice(i, 1)   // 2. uit je eigen collectie halen
                    continue
                }

                obj.shape.vertices.forEach((v, i) => {
                    v.x = verts[i].x
                    v.y = verts[i].y
                })
            }
        }

        // Remove speech bubbles from the objects array
        // this.objects = this.objects.filter(obj => !obj.name=="speechBubble")
        requestAnimationFrame(this.#draw.bind(this))
    }

    drawSpeechBubble = (speechBubble: SpeechBubble) => {
        const composites = speechBubble.composite.composites
        const leftSide = composites.find((c) => c.label === "leftside")
        const rightSide = composites.find((c) => c.label === "rightside")
        const anchor = composites.find((c) => c.label === "anchor").bodies[0]
        const leftPoints = leftSide.bodies.filter(body => body.label.startsWith("borderPoint"))
        const rightPoints = rightSide.bodies.filter(body => body.label.startsWith("borderPoint"))

        const points = [...new Set([...leftPoints, ...rightPoints])]

        const vertices = []

        for (let index = 1; index < points.length - 1; index++) {
            const body = points[index]
            vertices.push({ x: body.position.x, y: body.position.y })
        }
        
        if (anchor) {
            vertices.push({ x: leftPoints[0].position.x, y: leftPoints[0].position.y })
            vertices.push({ x: anchor.position.x, y: anchor.position.y })
            vertices.push({ x: anchor.position.x, y: anchor.position.y })
            vertices.push({ x: rightPoints[rightPoints.length - 1].position.x, y: rightPoints[rightPoints.length - 1].position.y })
        }

        const anchors = vertices.map(p => new Two.Anchor(p.x, p.y))
        const path = new Two.Path(anchors, false, false) // false = niet closed
        
        //
        path.noStroke()
        path.fill = "#F8FADB"
        
        path.curved = true
        path.closed = false        

        this.objects.push({
            shape: path,
            pos: { x:0, y:0 },
            name: `speechBubble,${speechBubble.composite.id}`,
            updateVertices: () => {
                if (speechBubble.death) {
                    return null
                }
                const leftSide = speechBubble.composite.composites.find((c) => c.label === "leftside")
                const rightSide = speechBubble.composite.composites.find((c) => c.label === "rightside")
                const anchor = speechBubble.composite.composites.find((c) => c.label === "anchor").bodies[0]
                const leftPoints = leftSide.bodies.filter(body => body.label.startsWith("borderPoint"))
                const rightPoints = rightSide.bodies.filter(body => body.label.startsWith("borderPoint"))
                const points = [...new Set([...leftPoints, ...rightPoints])]

                const vertices = []

                for (let index = 1; index < points.length - 1; index++) {
                    const body = points[index]
                    vertices.push({ x: body.position.x, y: body.position.y })
                }
        
                if (anchor) {
                    vertices.push({ x: rightPoints[rightPoints.length - 1].position.x, y: rightPoints[rightPoints.length - 1].position.y })
                    vertices.push({ x: leftPoints[0].position.x, y: leftPoints[0].position.y })
                    vertices.push({ x: leftPoints[0].position.x, y: leftPoints[0].position.y })
                    vertices.push({ x: anchor.position.x, y: anchor.position.y })
                }

                return vertices
            }
        })

        // Select last layer
        const layer = this.layers[this.layers.length -1]
        layer.add(path)
    }

    drawBG = (options?: { color?: string, blockSize?: number, offset?: number }) =>{

        const color = options?.color || "#fafafa"
        const blockSize = options?.blockSize || 8
        const offset = options?.offset || 2

        const gridHeight = this.two.height / (blockSize + offset)
        const gridWidth = this.two.width / (blockSize + offset)

        // create bg Group
        const bg = this.two.makeGroup()
        for (let y = 0; y < gridHeight; y ++) {
            for (let x = 0; x < gridWidth; x ++) {
                const rect = this.two.makeRectangle(
                    (blockSize + offset)/2 + (blockSize + offset) * x,
                    (blockSize + offset)/2 + (blockSize + offset) * y,
                    blockSize,
                    blockSize
                )
                rect.fill = color
                rect.noStroke()
                bg.add(rect)

            }
        }
        this.layers[0].add(bg)
        // this.layers.unshift(bg)
    }

    // Zorg ervoor dat Two.js is geïnstalleerd en geïmporteerd

    // De retourwaarde is nu een Promise<Two.Group>, aangezien SVG's in Two.js vaak als een groep worden geïmporteerd.
    // 'Two' en 'Two.Group' typen vereisen dat je de Two.js typendefinities (bijv. @types/two.js) hebt geïnstalleerd.

    async #importSVGAsync (urlOrString: string, options: { width: number, height: number, rotate?: number }) : Promise<Two.Group> {
        const two = this.two as Two 

        try {
            const response = await fetch(urlOrString)
            if (!response.ok) {
                throw new Error(`Could not load SVG: HTTP status ${response.status}`)
            }
            const svgData = await response.text()
            const parser = new DOMParser()
            const doc = parser.parseFromString(svgData, "image/svg+xml")
            const svgElement = doc.documentElement as unknown as SVGElement 
        
            if (!svgElement || svgElement.tagName !== "svg") {
                throw new Error("Parsed data is not a valid SVG element")
            }
            const svgItem = two.interpret(svgElement)
            const viewBox = svgElement.getAttribute("viewBox").split(" ")

            const bounds = {
                x: parseFloat(viewBox[0]),
                y: parseFloat(viewBox[1]),
                width: parseFloat(viewBox[2]),
                height: parseFloat(viewBox[3]),
            }
            svgItem.position.set(-bounds.width/2, -bounds.height/2)
            const group = new Two.Group(svgItem)
        
            if (!group) {
                throw new Error("Could not interpret SVG element into a Two.Group")
            }
    
            // 4. Schalen en Roteren (Logica blijft hetzelfde)
            if (options.width && options.height) {
                // get bounds from viewBox
               
                const scaleX = options.width / bounds.width
                const scaleY = options.height / bounds.height
                const scaleFactor = Math.min(scaleX, scaleY) 
                group.scale = scaleFactor
            }
        
            if (options.rotate) {
                group.rotation = options.rotate * (Math.PI / 180)
            }
            
            return group

        } catch (error) {
            console.error(`Error in #importSVGAsync for URL ${urlOrString}:`, error)
            return Promise.reject(error)
        }
    }

    addCatterpillar = async (catterpillar: CatterpillarModel) => {
        const texturePromises = []
        const bodyParts = catterpillar.bodyParts

        const catterpillarObj = {
            type: "catterpillar",
            id: catterpillar.composite.id,
            model: catterpillar,
            layers:{ 
                10: [{
                    mouth: {
                        model: catterpillar.mouth,
                        path: null as Two.Path | null
                    },
                    leftEye: {
                        model: catterpillar.leftEye,
                        group: null as Two.Group | null,
                    },
                    rightEye:  {
                        model: catterpillar.rightEye,
                        group: null as Two.Group | null,
                    },
                    bodyParts: []
                }]
            }
        } as objectModel


        for (let index = 0; index < bodyParts.length; index++) {
            const part = bodyParts[index]
            const diameter = catterpillar.thickness * 1.25
            let primaryColor = Chroma(catterpillar.primaryColor)
            let secondaryColor = Chroma(catterpillar.secondaryColor)

            // Ensure primary color is not too dark
            const primaryColorLightness = primaryColor.get("hsl")[2]
            if (primaryColorLightness <  0.24) {
                const brightenAmount = 0.24 - primaryColorLightness
                primaryColor = primaryColor.brighten(brightenAmount * 10)
            }
            
            // Ensure secondary color is not too dark
            const secondaryColorLightness = secondaryColor.get("hsl")[2]
            if (secondaryColorLightness <  0.24) {
                const brightenAmount = 0.24 - secondaryColorLightness
                secondaryColor = secondaryColor.brighten(brightenAmount * 10)
            }

            // Load texture
            const textures = []
            const svgOptions = { width: diameter, height: diameter } as { width: number, height: number, rotate?: number }
            let svgUrl = ""
            for (const textureType in catterpillar.texture) {
                svgOptions.rotate = undefined
                svgUrl = "./bodyparts/"
                if (textureType == "360") {
                    svgOptions.rotate = index * (360 / catterpillar.bodyParts.length)
                    svgUrl += `360/${catterpillar.texture[textureType]}`
                } else if (textureType == "top") {
                    svgUrl += `top/${catterpillar.texture[textureType]}`
                } else if (textureType == "bottom") {
                    svgUrl += `bottom/${catterpillar.texture[textureType]}`
                } else if (textureType == "vert") {
                    svgUrl += `vert/${catterpillar.texture[textureType]}`
                } else {
                    continue
                }
                svgUrl += `/${index % 8 + 1}.svg`
                if (index !== 0) {
                    const svgItem = await this.#importSVGAsync(svgUrl, svgOptions)
                    texturePromises.push(svgItem)
                    svgItem.fill = secondaryColor.hex()
                    textures.push(svgItem)
                }
            }

            const offset = Math.random() * 0.125
            // Define bodyPart color
            if (index % 2 === 0) {
                primaryColor.brighten(offset)
                secondaryColor.brighten(offset)
            } else {
                primaryColor.darken(offset)
                secondaryColor.darken(offset)
            }

            // Create bodypart circle
            const circleOptions = {
                radius: diameter / 2,
                strokeWidth: catterpillar.stroke,
                strokeColor: secondaryColor.hex(),
                color: primaryColor.hex(),
                name: `${catterpillar.composite.id},bodyPart`
            }

            if (part.type == "head") {
                circleOptions.name += ",head"
                // Add stroke to head if color is almost white
                if (Math.round(primaryColor.get("hsl")[2] * 100)/100 >= 0.9) {
                    circleOptions.strokeWidth = catterpillar.thickness * 0.05
                    circleOptions.strokeColor = secondaryColor.hex()
                }
            } else {
                if (Math.round(primaryColor.get("hsl")[2] * 100)/100 >= 0.95) {
                    circleOptions.strokeWidth = catterpillar.thickness * 0.05
                    circleOptions.strokeColor = secondaryColor.hex()
                }
            }

            const newBodyParts = catterpillarObj.layers[10][0].bodyParts
            const bodyPart = new Two.Circle(part.x, part.y, circleOptions.radius)
            bodyPart.fill = circleOptions.color
            bodyPart.noStroke()
            if (circleOptions.strokeWidth && circleOptions.strokeColor) {
                bodyPart.stroke = circleOptions.strokeColor
                bodyPart.linewidth = circleOptions.strokeWidth
            }
            const newBodyPart = {
                circle: bodyPart,
                textures: textures,
            }
            
            newBodyParts.push(newBodyPart)
        }

        // Wait for all textures to load
        await Promise.all(texturePromises)
        
        const head = catterpillar.bodyParts[0]
        const layer = this.layers[10]
        

        // Add bodyParts
        this.newObjects.push(catterpillarObj)
        catterpillarObj.layers[10][0].bodyParts = reverse(catterpillarObj.layers[10][0].bodyParts)
        
        const reverseBodyParts = reverse(catterpillarObj.layers[10][0].bodyParts)
        reverseBodyParts.forEach(bodyPart => {
            if (bodyPart.circle) {
                bodyPart.circle.name = `${catterpillar.composite.id},bodyPart`
                layer.add(bodyPart.circle)
            }
            
            bodyPart.textures.forEach((texture: Two.Group) => {
                texture.name = `${catterpillar.composite.id},bodyPart,texture`
                layer.add(texture)
            })
        })

        // Add mouth
        const mouth = this.addMouth(head,catterpillar.mouth,{ fill: "#000" })
        catterpillarObj.layers[10][0].mouth.path = mouth
        layer.add(catterpillarObj.layers[10][0].mouth.path)
        
        
        // Add left eye
        const leftEye = this.addEye( head, catterpillar.leftEye)
        catterpillarObj.layers[10][0].leftEye.group = leftEye
        layer.add(catterpillarObj.layers[10][0].leftEye.group)
        
        
        // Add right eye
        const rightEye = this.addEye( head, catterpillar.rightEye)
        catterpillarObj.layers[10][0].rightEye.group = rightEye
        layer.add(catterpillarObj.layers[10][0].rightEye.group)

        // Add to newObjects
        this.newObjects.push(catterpillarObj)
    }

    drawCatterpillar = (catterpillar: objectModel) => {
        if (catterpillar.model.destroyed) {
            return false
        }

        const bodyParts = catterpillar.model.bodyParts
        bodyParts.forEach((part, index) => {
            const bodyPartObj = catterpillar.layers[10][0].bodyParts[index]
            // Update circle position
            if (bodyPartObj.circle) {
                bodyPartObj.circle.position.set(part.x, part.y)
            }
            
            // Update textures position
            if (bodyPartObj.textures) {
                bodyPartObj.textures.forEach((texture: Two.Group) => {
                    if (!texture) return      
                    
                    texture.position.set(part.x, part.y)
                })
            }
        })

        const mouth = catterpillar.layers[10][0].mouth
        const leftEye = catterpillar.layers[10][0].leftEye
        const rightEye = catterpillar.layers[10][0].rightEye

        // Update mouth position 
        if (mouth) {
            this.drawMouth(mouth)
        }


        if (rightEye.model && rightEye.group) {
            if (!this.drawEye(rightEye)) {
                rightEye.group.remove()  // 1. uit Two.js scene halen
                rightEye.model = null         // 2. uit je eigen collectie halen
            }
        }

        if (leftEye.model && leftEye.group) {
            if (!this.drawEye(leftEye)) {
                leftEye.group.remove()  // 1. uit Two.js scene halen
                leftEye.model = null         // 2. uit je eigen collectie halen
            }
        }


        if (catterpillar.speechBubble) {
            const exists = this.objects.find(obj => obj.name == `speechBubble,${catterpillar.speechBubble.composite.id}`)
            if (exists) return true
            this.drawSpeechBubble(catterpillar.speechBubble)
        }

        return true

    }


    addFood = async (food: FoodModel) => {
        const svg = await this.#importSVGAsync("./leaf.svg", { width: food.size, height: food.size } )
        const layer = this.layers[10]

        const obj = {
            type: "food",
            id: food.composite.id,
            model: food,
            layers:{ 
                10: [{
                    level: 0,
                    svg
                }]
            }
        }
        

        layer.add(svg)
        this.newObjects.push(obj)
        this.drawFood(obj)
    }

    addBall = async (ball: BallModel) => {
        const svg = await this.#importSVGAsync("./ball.svg", { width: ball.size * 2 , height: ball.size * 2 } )
        const layer = this.layers[10]

        const obj = {
            type: "ball",
            id: ball.composite.id,
            model: ball,
            layers:{ 
                10: [{
                    level: 0,
                    svg
                }]
            }
        }
        layer.add(svg)
        this.newObjects.push(obj)
        this.drawBall(obj)
    }

    addPlank = async (plank: PlankModel) => {
        const obj = {
            type: "plank",
            id: plank.body.id,
            model: plank,
            layers:{ 
                10: [{
                    level: 0,
                    squares: []
                }]
            }
        }

        this.newObjects.push(obj)
        this.drawPlank(obj)
    }
    
    drawPlank = (plank: objectModel) => {
        const numSquares = Math.ceil(plank.model.width / 18)
        if (numSquares != plank.layers[10][0].squares.length) {
            // Recreate squares
            plank.layers[10][0].squares.forEach(square => {
                this.two.remove(square)
            })
            plank.layers[10][0].squares = []
            const offsetX = 0
            for (let i = 0; i < numSquares; i++) {
                const x = offsetX + i * 18 + 9
                const y = plank.model.y + 2
                const size = 16
                const square = this.two.makeRectangle(x, y, size, size)
                square.fill = plank.model.color
                square.noStroke()
                plank.layers[10][0].squares.push(square)
                this.two.add(square) 
                // this.layers[10].add(square)
            }
        }

        plank.layers[10][0].squares.forEach((square, index) => {
            const offsetX = -plank.model.width / 2
            const x = offsetX + plank.model.x + index * 18 + 9
            const y = plank.model.y + 2
            square.position.set(x, y)
        })
    }

    drawBall = (ball: objectModel) => {
        if (!ball.model || ball.model.destroyed) {
            return false
        }
        ball.layers[10][0].svg.position.set(ball.model.x, ball.model.y)
        ball.layers[10][0].svg.rotation = ball.model.rotation

        return true
    }

    drawFood = (food: objectModel) => {
        food.layers[10][0].svg.position.set(food.model.x, food.model.y)
        food.layers[10][0].svg.rotation = food.model.rotation
    }

    addMouth(
        pos: { x: number, y: number },
        mouth: Mouth,
        options: { stroke?: string; strokeWidth?: number; fill?: string } = {},
    ) {
        const anchors = mouth.coordinates.map(p => new Two.Anchor(p.x, p.y))

        const path = new Two.Path(anchors, false, false) // false = niet closed
        if (options.stroke && options.strokeWidth) {
            path.stroke = options.stroke
        } else {
            path.noStroke()
        }

        if (options.strokeWidth) {
            path.linewidth = options.strokeWidth
        }

        if (options.fill) {
            path.fill = options.fill
        }

        path.curved = true
        path.closed = true

        return path
    }

    drawMouth = (mouth: { model: Mouth, path: Two.Path }) => {
        if (!mouth.model) {
            mouth.path.remove()  // 1. uit Two.js scene halen
            mouth = null         // 2. uit je eigen collectie halen
        }
        mouth.path.position.set(mouth.model.x, mouth.model.y)

        const verts = mouth.model.coordinates.map(p => ({ x: p.x, y: p.y }))
        mouth.path.vertices.forEach((v, i) => {
            v.x = verts[i].x
            v.y = verts[i].y
        })
    }

    addEye(
        pos: { x: number, y: number },
        eye: Eye,
    ) : EyeGroup {
        // 1. Maak eyelid path
        const anchors = eye.lid.map(p => new Two.Anchor(p.x, p.y))
        const eyelid = new Two.Path(anchors, true, true)
        eyelid.fill = "#fff"
        
        // 2. Maak pupil
        const pupil = new Two.Circle(
            eye.pupil.x,
            eye.pupil.y,
            Math.max(eye.width, eye.height) / 5
        )
        pupil.fill = "#000"
        pupil.noStroke()
        
        // 3. Maak group die gemaskt wordt
        const eyeGroup = new Two.Group()
        const eyelidMask = eyelid.clone()
        eyeGroup.add(eyelid)
        eyeGroup.add(pupil)
        eyeGroup.mask = eyelidMask

        eyeGroup.lid = eyelid
        eyeGroup.pupil = pupil

        return eyeGroup
    }

    drawEye = (eye: { model: Eye, group: EyeGroup }) => {
        const eyeGroup = eye.group as EyeGroup
        const eyeObj = eye.model as Eye

        if (!eyeObj) {
            eyeGroup.remove()  // 1. uit Two.js scene halen
            return false
        }
        
        const lid = eyeGroup.lid as Two.Path
        const pupil = eyeGroup.pupil as Two.Circle
        
        const pupilX = eyeObj.pupil.x - eyeObj.x 
        const pupilY = eyeObj.pupil.y - eyeObj.y 
        
        eyeGroup.position.set(eyeObj.x, eyeObj.y)
        pupil.position.set(pupilX, pupilY)
        
        const verts = eyeObj.lid.map(p => ({ x: p.x, y: p.y }))
        lid.vertices.forEach((v, i) => {
            v.x = verts[i].x
            v.y = verts[i].y
        })
        return true
    }
    
    removeBall(ball: objectModel) {
        if (!ball) return
        // Remove from Draw.objects
        for (const i in ball.layers) { 
            const layer = ball.layers[i]
            layer.forEach(layerObj => {
                if (layerObj.svg) {
                    layerObj.svg.remove()
                }
            })
        }

        if (ball.model) {
            ball.model.destroy()
            ball.model = undefined
        }
        ball = undefined
    }

    removeCatterpillar(catterpillarObj: objectModel) {
        if (!catterpillarObj) return

        // Remove from Draw.objects
        for (const i in catterpillarObj.layers) { 
            const layer = catterpillarObj.layers[i]
            layer.forEach(layerObj => {
                // remove bodyparts
                if (layerObj.bodyParts) {
                    layerObj.bodyParts.forEach((bodyPart: { circle: Two.Circle, textures: Two.Group[] }) => {
                        if (bodyPart.circle) {
                            bodyPart.circle.remove() 
                        }
                        bodyPart.textures.forEach((texture: Two.Group) => {
                            texture.remove()
                        })
                    })
                }
                // remove eyes and mouth
                if (layerObj.leftEye && layerObj.leftEye.group) {
                    layerObj.leftEye.group.remove()
                }
                if (layerObj.rightEye && layerObj.rightEye.group) {
                    layerObj.rightEye.group.remove()
                }
                if (layerObj.mouth && layerObj.mouth.path) {
                    layerObj.mouth.path.remove()
                }
            })
        }

        if (catterpillarObj.model) {
            catterpillarObj.model.destroy()
            catterpillarObj.model = undefined
        }
        catterpillarObj = undefined
    }


    removeObjectById(id: number) {
        const obj = this.newObjects.find(o => o.id === id)
        this.newObjects = this.newObjects.filter(o => o.id !== id)
        if (!obj) return

        if (obj.type == "catterpillar") {
            this.removeCatterpillar(obj)
            return
        }

        // Remove from Draw.objects
        for (const i in obj.layers) { 
            const layer = obj.layers[i]
            layer.forEach(layerObj => {
                if (layerObj.svg) {
                    layerObj.svg.remove()
                }
            })
        }
    }

}