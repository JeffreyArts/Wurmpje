// @ts-nocheck
import CatterpillarModel from "@/models/catterpillar"
import Chroma from "chroma-js"
import gsap from "gsap"
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
    type: "food" | "catterpillar" | "speechBubble",
    model: FoodModel | CatterpillarModel | SpeechBubble,
    layers: Layers
}

type Layers = {
    [key: number]: Two.Shape[]; // key = laagnummer, value = array van Two.Shape
}

export class Draw {
    two: Two
    objects: Array<{ shape: Two.Shape, pos: { x: number, y: number }, updateVertices?: () => Array<{ x: number, y: number }> }> = []
    layers: Two.Group[] = []
    newObjects: Array<objectModel> = []
    catterpillars: CatterpillarModel[] = []

    constructor(two: Two) {
        this.two = two
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

        this.catterpillars.forEach(catterpillar => {
            if (catterpillar.speechBubble) {
                const exists = this.objects.find(obj => obj.name == `speechBubble,${catterpillar.speechBubble.composite.id}`)
                if (exists) return
                this.#drawSpeechBubble(catterpillar.speechBubble)
            }
        })

        this.newObjects.forEach(obj => {
            if (obj.type == "food") {
                this.drawFood(obj)
            } else if (obj.type == "ball") {
                this.drawBall(obj)
            } else if (obj.type == "plank") {
                this.drawPlank(obj)
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

    #drawSpeechBubble = (speechBubble: SpeechBubble) => {
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
            const group = two.makeGroup(svgItem)
        
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
        
            // 5. Toevoegen aan de scene
            two.add(group) 
            two.update() 
            return group

        } catch (error) {
            console.error(`Error in #importSVGAsync for URL ${urlOrString}:`, error)
            return Promise.reject(error)
        }
    }

    addCircle(
        pos: { x: number, y: number },
        options: { radius: number, color: string, name?: string, strokeWidth?: number, strokeColor?: string },
        layer?: Two.Group
    ): Two.Circle {
        const { radius, color } = options
        let { name } = options
        if (!name) {
            name = `circle-${Date.now()}`
        }
        const circle = this.two.makeCircle(pos.x, pos.y, radius)
        circle.fill = color
        circle.noStroke()
        if (options.strokeWidth && options.strokeColor) {
            circle.stroke = options.strokeColor
            circle.linewidth = options.strokeWidth
        }
        this.objects.push({ shape: circle, pos: pos, name })

        if (layer) {
            layer.add(circle)
        }
        return circle
    }

    addSVG(
        pos: { x: number, y: number },
        svgItem: Two.Shape,
        options?: { name?: string, rotation?: boolean },
        layer?: Two.Group
    ): Two.Shape {
        svgItem.position.set(pos.x, pos.y)
        // this.objects.push({ shape: svgItem, pos: pos })
        let { name } = options
        if (!name) {
            name = `svg-${Date.now()}`
        }
        

        this.objects.push({ shape: svgItem, pos: pos, name })

        if (layer) {
            layer.add(svgItem)
        }

        return svgItem
    }

    addCatterpillar = async (catterpillar: CatterpillarModel) => {
        const texturePromises = []
        const bodyParts = catterpillar.bodyParts
        this.catterpillars.push(catterpillar)
        const newBodyParts = []
        for (let index = 0; index < bodyParts.length; index++) {
            const newBodyPart = {
                circle: null,
                textures: [] as Two.Group[],
                mouth: null as Two.Group | null,
                leftEye: null as { eyeGroup: Two.Group, eyelid: Two.Path, pupil: Two.Circle } | null,
                rightEye: null as { eyeGroup: Two.Group, eyelid: Two.Path, pupil: Two.Circle } | null,
            }

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
            // Add to canvas
            const circleOptions = {
                radius: diameter / 2,
                strokeWidth: catterpillar.stroke,
                strokeColor: secondaryColor.hex(),
                color: primaryColor.hex(),
                name: `${catterpillar.composite.label}-bodyPart-${index}`
            }

            if (part.type == "head") {
                
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
            
            newBodyPart.circle = this.addCircle(part, circleOptions)
            if (index !== 0) {
                newBodyPart.textures = []
                textures.forEach(svgItem => {
                    newBodyPart.textures.push(this.addSVG(part, svgItem, { name: `bodypart-${index}-texture` }))
                })
            }

            if (index === 0) {
                newBodyPart.mouth = this.addMouth(part,catterpillar.mouth,{ fill: "#000" })

                newBodyPart.leftEye = this.addEye( part, catterpillar.leftEye, this.layers[2])
                newBodyPart.rightEye = this.addEye( part, catterpillar.rightEye, this.layers[2])
            }
            newBodyParts.push(newBodyPart)
        }

        // Loop through newBodyParts and voeg alles toe aan de gewenste layer
        reverse(newBodyParts).forEach(bodyPart => {
            const layer = this.layers[1]
            if (bodyPart.circle) {
                layer.add(bodyPart.circle)
            }

            bodyPart.textures.forEach((texture: Two.Group) => {
                layer.add(texture)
            })

            if (bodyPart.mouth) {
                layer.add(bodyPart.mouth)
            }
            
            if (bodyPart.leftEye) {
                layer.add(bodyPart.leftEye.eyeGroup)
                layer.add(bodyPart.leftEye.eyelid)
                layer.add(bodyPart.leftEye.pupil)
            }
            if (bodyPart.rightEye) {
                layer.add(bodyPart.rightEye.eyeGroup)
                layer.add(bodyPart.rightEye.eyelid)
                layer.add(bodyPart.rightEye.pupil)
            }
        })
    }


    addFood = async (food: FoodModel) => {
        const svg = await this.#importSVGAsync("./leaf.svg", { width: food.size, height: food.size } )
        
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
        

        this.newObjects.push(obj)
        this.drawFood(obj)
    }

    addBall = async (ball: BallModel) => {
        const svg = await this.#importSVGAsync("./ball.svg", { width: ball.size * 2 , height: ball.size * 2 } )

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
        ball.layers[10][0].svg.position.set(ball.model.x, ball.model.y)
        ball.layers[10][0].svg.rotation = ball.model.rotation
    }

    drawFood = (food: objectModel) => {
        food.layers[10][0].svg.position.set(food.model.x, food.model.y)
        food.layers[10][0].svg.rotation = food.model.rotation
    }

    addMouth(
        pos: { x: number, y: number },
        mouth: Mouth,
        options: { stroke?: string; strokeWidth?: number; fill?: string } = {},
        layer: Two.Group
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

        // Voeg toe aan Draw.objects voor realtime update
        this.objects.push({
            shape: path,
            pos: mouth,
            name: "mouth",
            updateVertices: () => {
                return mouth.coordinates.map(p => ({ x: p.x, y: p.y }))
            }
        })

        if (layer) {
            layer.add(path)
        }
        return path
    }

    addEye(
        pos: { x: number, y: number },
        eye: Eye,
        layer: Two.Group
    ) {
        // 1. Maak eyelid path
        const anchors = eye.lid.map(p => new Two.Anchor(p.x, p.y))
        const eyelid = new Two.Path(anchors, true, true)
        eyelid.fill = "#fff"
        
        // 2. Maak pupil
        const pupil = this.two.makeCircle(
            eye.pupil.x,
            eye.pupil.y,
            Math.max(eye.width, eye.height) / 5
        )
        pupil.fill = "#000"
        pupil.noStroke()
        
        // 3. Maak group die gemaskt wordt
        const eyeGroup = new Two.Group()
        const eyelidMask = eyelid.clone()
        eyeGroup.add(pupil)
        eyeGroup.mask = eyelidMask

        // 4. Voeg toe aan Draw.objects voor realtime update
        this.objects.push({
            shape: eyelid,
            pos: eye,
            name: "eyelid",
            updateVertices: () => eye.lid.map(p => ({ x: p.x, y: p.y }))
        })
        this.objects.push({
            shape: eyelidMask,
            pos: eye,
            name: "eyelid",
            updateVertices: () => eye.lid.map(p => ({ x: p.x, y: p.y }))
        })

        this.objects.push({
            shape: pupil,
            pos: eye.pupil,
            name: "pupil",
        })

        // 5. Voeg toe aan layers, zodat ze ook zichtbaar zijn
        if (layer) {
            layer.add(eyelid)
            layer.add(eyeGroup)
        }
        return { eyeGroup, eyelid, pupil }
    }

    removeObjectById(id: number) {
        const obj = this.newObjects.find(o => o.id === id)
        console.log("obj:", obj, this.newObjects)
        this.newObjects = this.newObjects.filter(o => o.id !== id)
        if (!obj) return

        // Remove from Draw.objects
        for (const i in obj.layers) { 
            const layer = obj.layers[i]
            layer.forEach(layerObj => {
                
                if (layerObj.svg) {
                    // Not a real solution, but the remove method throws an error
                    layerObj.svg.position.set(-9999, -9999)
                    // this.two.remove(layerObj.svg)
                }
            })
        }
    }

}