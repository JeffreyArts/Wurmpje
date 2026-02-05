import type CatterpillarModel from "@/models/catterpillar"
import type FoodModel from "@/models/food"
import type SpeechBubble from "@/models/speech-bubble"
import type BallModel from "@/models/ball"
import type PlankModel from "@/models/plank"
import type PaintingModel from "@/models/painting"

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
    "/bodyparts/bottom/b9",
    "/bodyparts/bottom/b10",
    "/bodyparts/bottom/b11",
    "/bodyparts/bottom/b12",
    "/bodyparts/bottom/b13",
    "/bodyparts/bottom/b14",
    "/bodyparts/bottom/b15",
    "/bodyparts/bottom/b16",
    "/bodyparts/bottom/b17",
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
    "/bodyparts/top/t11",
    "/bodyparts/top/t12",
    "/bodyparts/vert/v1",
    "/bodyparts/vert/v2",
    "/bodyparts/vert/v3",
    "/bodyparts/vert/v4",
    "/bodyparts/vert/v5",
    "/bodyparts/vert/v6",
    "/bodyparts/vert/v7",
    "/bodyparts/vert/v8",
    "/bodyparts/vert/v9",
    "/bodyparts/vert/v10",
    "/bodyparts/vert/v11",
    "/bodyparts/vert/v12",
    "/bodyparts/vert/v13",
    "/bodyparts/vert/v14",
    "/bodyparts/vert/polkadots",
]

type TwoGroup = InstanceType<typeof Two.Group>
type TwoCircle = InstanceType<typeof Two.Circle>
type TwoPath = InstanceType<typeof Two.Path>
type TwoTexture = InstanceType<typeof Two.Texture>

interface FoodObjectModel {
    type: "food";
    id: number;
    model: FoodModel;
    two: { svg: TwoGroup };
}

interface BallObjectModel {
    type: "ball";
    id: number;
    model: BallModel;
    two: { svg: TwoGroup };
}

interface PlankObjectModel {
    type: "plank";
    id: number;
    model: PlankModel;
    two: { squares: TwoGroup };
}

interface PaintingObjectModel {
    type: "painting";
    id: number;
    model: PaintingModel;
    two: { image: TwoGroup, rope: TwoGroup };
}

interface EyeObjectModel {
    type: "eye";
    id: string;
    model: Eye;
    two: { group: TwoGroup; pupil: TwoCircle; lid: TwoPath };
}

interface MouthObjectModel {
    type: "mouth";
    id: string;
    model: Mouth;
    two: { path: TwoPath };
}

interface CatterpillarObjectModel {
    type: "catterpillar";
    id: number;
    model: CatterpillarModel;
    two: {
        bodyParts: Array<{ circle: TwoCircle; textures: TwoGroup[] }>;
        leftEye?: EyeObjectModel;
        rightEye?: EyeObjectModel;
        mouth?: MouthObjectModel;
    };
}

interface SpeechBubbleObjectModel {
    type: "speechBubble";
    id: number;
    model: SpeechBubble;
    two: { bubble: TwoPath; anchor: TwoPath };
}

export class Draw {
    two: Two
    layers: TwoGroup[] = []
    objects: Array<FoodObjectModel | BallObjectModel | PlankObjectModel | PaintingObjectModel | CatterpillarObjectModel | SpeechBubbleObjectModel> = []
    renderer?: Matter.Render | undefined

    constructor(two: Two, renderer?: Matter.Render) {
        this.two = two
        this.renderer = renderer
        for (let i = 0; i < 16; i++) {
            const layer = this.two.makeGroup() as TwoGroup
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

        this.objects.forEach(obj => {
            if (obj.type == "food") {
                if (!this.drawFood(obj)) {
                    this.#removeFood(obj)
                    this.objects = this.objects.filter(o => o.id !== obj.id)
                }
            } else if (obj.type == "ball") {
                if (!this.drawBall(obj))  {
                    this.#removeBall(obj)
                    this.objects = this.objects.filter(o => o.id !== obj.id)
                }
            } else if (obj.type == "plank") {
                this.drawPlank(obj)
            } else if (obj.type == "catterpillar") {
                if (!this.drawCatterpillar(obj)) {
                    this.#removeCatterpillar(obj)
                }
            } else if (obj.type == "speechBubble") {
                if (!this.drawSpeechBubble(obj)) {
                    this.#removeSpeechBubble(obj)
                    this.objects = this.objects.filter(o => o.id !== obj.id)
                }
            } else if (obj.type == "painting") {
                this.drawPainting(obj)
            }
        })
        
        requestAnimationFrame(this.#draw.bind(this))
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

    async #importSVGAsync (urlOrString: string, options: { width: number, height: number, rotate?: number }) : Promise<TwoGroup> {
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


    // ADD METHODS


    addCatterpillar = async (catterpillar: CatterpillarModel, layerIndex = 10) => {
        const layer = this.layers[layerIndex]

        const texturePromises = []
        const bodyParts = catterpillar.bodyParts

        const catterpillarObj = {
            type: "catterpillar",
            id: catterpillar.composite.id,
            model: catterpillar,
            two:{ 
                mouth: undefined as MouthObjectModel | undefined,
                leftEye: undefined as EyeObjectModel | undefined,
                rightEye:  undefined as EyeObjectModel | undefined,
                bodyParts: []
            }
        } as CatterpillarObjectModel

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

            const newBodyParts = catterpillarObj.two.bodyParts
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

        // Add bodyParts
        this.objects.push(catterpillarObj)
        catterpillarObj.two.bodyParts = reverse(catterpillarObj.two.bodyParts)
        
        const reverseBodyParts = reverse(catterpillarObj.two.bodyParts)
        reverseBodyParts.forEach(bodyPart => {
            if (bodyPart.circle) {
                // bodyPart.circle.name = `${catterpillar.composite.id},bodyPart`
                layer.add(bodyPart.circle)
            }
            
            bodyPart.textures.forEach((texture: TwoGroup) => {
                // texture.name = `${catterpillar.composite.id},bodyPart,texture`
                layer.add(texture)
            })
        })

        // Add mouth
        const mouth = this.addMouth(catterpillar.mouth)
        catterpillarObj.two.mouth = mouth
        
        // Add left eye
        const leftEye = this.addEye( catterpillar.leftEye)
        catterpillarObj.two.leftEye = leftEye
        
        // Add right eye
        const rightEye = this.addEye( catterpillar.rightEye)
        catterpillarObj.two.rightEye = rightEye

        // Add to objects
        this.objects.push(catterpillarObj)
    }
    
    addFood = async (food: FoodModel, layerIndex = 10) => {
        const svg = await this.#importSVGAsync("./leaf.svg", { width: food.size, height: food.size } )
        const layer = this.layers[layerIndex]

        const obj = {
            type: "food",
            id: food.composite.id,
            model: food,
            two: {
                svg
            }
        } as FoodObjectModel
        
        layer.add(svg)
        this.objects.push(obj)
        this.drawFood(obj)
    }

    addBall = async (ball: BallModel, layerIndex = 10) => {
        const svg = await this.#importSVGAsync("./ball.svg", { width: ball.size * 2 , height: ball.size * 2 } )
        const layer = this.layers[layerIndex]

        const obj = {
            type: "ball",
            id: ball.composite.id,
            model: ball,
            two: { 
                svg
            }
        } as BallObjectModel

        layer.add(svg)
        this.objects.push(obj)
        this.drawBall(obj)
    }

    addPainting = async (painting: PaintingModel, layerIndex = 10) => {
        const layer = this.layers[layerIndex]

        // Maak Two.Image
        const img = new Two.Image( painting.image, 0, 0, painting.width, painting.height)
        const image = new Two.Group(img)
        
        // Maak het touw
        const rope = new Two.Group()
        const ropes = painting.composite.composites.filter(c => c.label === "rope")
        ropes.forEach(ropeComposite => {
            ropeComposite.bodies.forEach(body => {
                const circle = new Two.Rectangle(body.position.x, body.position.y, 6, 6)
                circle.fill = "#000"
                circle.noStroke()
                rope.add(circle)
            })
        })

        // Voeg toe aan layer
        layer.add(rope)
        layer.add(image)

        // Maak het painting object
        const obj: PaintingObjectModel = {
            type: "painting",
            id: painting.composite.id,
            model: painting,
            two: {
                image,
                rope
            }
        }

        this.objects.push(obj)

        // Teken de painting (optioneel, afhankelijk van implementatie)
        this.drawPainting(obj)
    }


    addPlank = (plank: PlankModel, layerIndex = 10) => {
        const layer = this.layers[layerIndex]
        const squares = new Two.Group()
        const obj = {
            type: "plank",
            id: plank.body.id,
            model: plank,
            two:{ 
                squares
            }
        } as PlankObjectModel

        layer.add(squares)
        this.objects.push(obj)
        this.drawPlank(obj)
    }

    addEye = ( eye: Eye, layerIndex = 10 ) => {
        const layer = this.layers[layerIndex]

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

        const obj = {
            type: "eye",
            id: eye.id,
            model: eye,
            two: { 
                group: eyeGroup,
                lid: eyelid,
                pupil: pupil
            }   
        } as EyeObjectModel

        layer.add(eyeGroup)
        
        return obj
    }

    addMouth = ( mouth: Mouth, layerIndex = 10 ) => {
        const layer = this.layers[layerIndex]
        const anchors = mouth.coordinates.map(p => new Two.Anchor(p.x, p.y))

        const path = new Two.Path(anchors, false, false) // false = niet closed
        
        path.noStroke()
        path.fill = "#111"

        path.curved = true
        path.closed = true

        const obj = {
            type: "mouth",
            id: mouth.id,
            model: mouth,
            two:{ 
                path
            }   
        } as MouthObjectModel

        layer.add(path)

        return obj
    }

    addSpeechBubble = (speechBubble: SpeechBubble, layerIndex = 11) => {
        const layer = this.layers[layerIndex]

        // BUBBLE
        const bubblePath = speechBubble.bubble.outline.map(body => new Two.Anchor(body.position.x, body.position.y))
        const bubble = new Two.Path(bubblePath, false, false) // false = niet closed
        
        bubble.noStroke()
        bubble.fill = "#F8FADB"
        
        bubble.curved = true
        bubble.closed = false    
        
        // ANCHOR
        const anchor = new Two.Path([
            new Two.Anchor(speechBubble.bubble.anchor.bodies[0].position.x, speechBubble.bubble.anchor.bodies[0].position.y),
            new Two.Anchor(speechBubble.bubble.left.bodies[1].position.x, speechBubble.bubble.left.bodies[1].position.y),
            new Two.Anchor(speechBubble.bubble.left.bodies[2].position.x, speechBubble.bubble.left.bodies[2].position.y),
        ], false, false) // false = niet closed

        anchor.noStroke()
        anchor.fill = "#F8FADB"

        layer.add(bubble)
        layer.add(anchor)

        return {
            type: "speechBubble",
            id: speechBubble.composite.id,
            model: speechBubble,
            two: {
                bubble: bubble,
                anchor: anchor
            }
        } as SpeechBubbleObjectModel
    }



    // DRAW METHODS



    drawBall = (ball: BallObjectModel) => {
        if (!ball.model || ball.model.isDestroyed) {
            return false
        }
        ball.two.svg.position.set(ball.model.x, ball.model.y)
        ball.two.svg.rotation = ball.model.rotation

        return true
    }

    drawCatterpillar = (catterpillar: CatterpillarObjectModel) => {
        if (!catterpillar.model || catterpillar.model.isDestroyed) {
            return false
        }

        const bodyParts = catterpillar.model.bodyParts
        bodyParts.forEach((part, index) => {
            const bodyPartObj = catterpillar.two.bodyParts[index]
            // Update circle position
            if (bodyPartObj.circle) {
                bodyPartObj.circle.position.set(part.x, part.y)
            }
            
            // Update textures position
            if (bodyPartObj.textures) {
                bodyPartObj.textures.forEach((texture: TwoGroup) => {
                    if (!texture) return      
                    
                    texture.position.set(part.x, part.y)
                })
            }
        })

        const mouth = catterpillar.two.mouth
        const leftEye = catterpillar.two.leftEye
        const rightEye = catterpillar.two.rightEye

        // Update mouth position 
        if (mouth) {
            this.drawMouth(mouth)
        }

        if (rightEye) {
            if (!this.drawEye(rightEye)) {
                this.#removeEye(rightEye)
                catterpillar.two.rightEye = null
            }
        }

        if (leftEye) {
            if (!this.drawEye(leftEye)) {
                this.#removeEye(leftEye)
                catterpillar.two.leftEye = null
            }
        }
        

        if (catterpillar.model.speechBubble) {
            if (catterpillar.model.speechBubble.isDestroyed) {
                catterpillar.model.speechBubble = undefined
                return true
            }
            const exists = this.objects.find(obj => obj.id == catterpillar.model.speechBubble.composite.id)
            if (exists) return true
            this.objects.push(this.addSpeechBubble(catterpillar.model.speechBubble))
        }

        return true

    }

    drawEye = (eye: EyeObjectModel) => {
        if (!eye.model || eye.model.isDestroyed) {
            this.#removeEye(eye)
            return false
        }

        const lid = eye.two.lid 
        const pupil = eye.two.pupil

        const pupilX = eye.model.pupil.x - eye.model.x 
        const pupilY = eye.model.pupil.y - eye.model.y 
        
        eye.two.group.position.set(eye.model.x, eye.model.y)
        pupil.position.set(pupilX, pupilY)
        
        const verts = eye.model.lid.map(p => ({ x: p.x, y: p.y }))
        lid.vertices.forEach((v, i) => {
            v.x = verts[i].x
            v.y = verts[i].y
        })
        return true
    }

    drawFood = (food: FoodObjectModel) => {
        // console.log("Draw food", food)
        if (!food.model || food.model.isDestroyed) {
            this.#removeFood(food)
            return false
        }
        
        food.two.svg.position.set(food.model.x, food.model.y)
        food.two.svg.rotation = food.model.rotation
        return true
    }

    drawMouth = (mouth: MouthObjectModel) => {
        const mouthTwo = mouth.two 
        
        if (!mouth.model || mouth.model.isDestroyed) {
            this.#removeMouth(mouth)
            return
        }
        
        mouthTwo.path.position.set(mouth.model.x, mouth.model.y)

        const verts = mouth.model.coordinates.map(p => ({ x: p.x, y: p.y }))
        mouthTwo.path.vertices.forEach((v, i) => {
            v.x = verts[i].x
            v.y = verts[i].y
        })
    }
    
    drawPlank = (plank: PlankObjectModel) => {
        const numSquares = Math.ceil(plank.model.width / 18)
        if (numSquares != plank.two.squares.length) {
            // Recreate squares
            plank.two.squares.children.forEach(child => {
                child.remove()
            })
            
            const offsetX = 0
            for (let i = 0; i < numSquares; i++) {
                const x = offsetX + i * 18 + 9
                const y = plank.model.y + 2
                const size = 16
                const square = new Two.Rectangle(x, y, size, size)
                square.fill = plank.model.color
                square.noStroke()
                plank.two.squares.add(square)
                this.two.add(square) 
            }
        }

        plank.two.squares.children.forEach((square, index) => {
            const offsetX = -plank.model.width / 2
            const x = offsetX + plank.model.x + index * 18 + 9
            const y = plank.model.y + 2
            square.position.set(x, y)
        })
    }

    drawPainting = (painting: PaintingObjectModel) => {
        
        if (!painting.model || painting.model.isDestroyed) {
            return false
        }

        // Draw rope links
        if (painting.two.rope) {
            let ropeIndex = 0
            
            const ropes = painting.model.composite.composites.filter(c => c.label === "rope")
            ropes.forEach(ropeComposite => {
                ropeComposite.bodies.forEach(body => {
                    const circle = painting.two.rope.children[ropeIndex]
                    if (circle) {
                        circle.position.set(body.position.x, body.position.y)
                    }
                    ropeIndex++
                })
            })
        }
        
        // Draw painting
        painting.two.image.position.set(painting.model.x, painting.model.y)
        painting.two.image.rotation = painting.model.rotation

        return true

    }

    drawSpeechBubble = (speechBubble: SpeechBubbleObjectModel) => {
        if (!speechBubble.model || speechBubble.model.isDestroyed) {
            return false
        }

        // const composites = speechBubble.model.composite.composites
        const bubble = speechBubble.two.bubble
        const anchor = speechBubble.two.anchor
        
        bubble.vertices.forEach((v, i) => {
            v.x = speechBubble.model.bubble.outline[i].position.x
            v.y = speechBubble.model.bubble.outline[i].position.y
        })

        anchor.vertices[0].x = speechBubble.model.bubble.anchor.bodies[0].position.x
        anchor.vertices[0].y = speechBubble.model.bubble.anchor.bodies[0].position.y
        anchor.vertices[1].x = speechBubble.model.bubble.left.bodies[1].position.x
        anchor.vertices[1].y = speechBubble.model.bubble.left.bodies[1].position.y
        anchor.vertices[2].x = speechBubble.model.bubble.left.bodies[2].position.x
        anchor.vertices[2].y = speechBubble.model.bubble.left.bodies[2].position.y

        return true
    }


    // REMOVE METHODS


    #removeBall(ball: BallObjectModel) {
        if (!ball) return
        if (ball.type != "ball") { console.error("Invalid objectModel for #removeBall"); return }

        if (ball.two.svg) {
            ball.two.svg.remove()
            ball.two.svg = null
        }

        if (ball.model) {
            ball.model.destroy()
            ball.model = null
        }
    }

    #removeCatterpillar(catterpillarObj: CatterpillarObjectModel) {
        if (!catterpillarObj) return 
        if (catterpillarObj.type != "catterpillar") { console.error("Invalid objectModel for #removeCatterpillar"); return }
        if (!catterpillarObj.two) return

        // remove bodyparts
        if (catterpillarObj.two.bodyParts) {
            catterpillarObj.two.bodyParts.forEach((bodyPart: { circle: TwoCircle, textures: TwoGroup[] }) => {
                if (bodyPart.circle) {
                    bodyPart.circle.remove() 
                }
                bodyPart.textures.forEach((texture: TwoGroup) => {
                    texture.remove()
                })
            })
        }

        // remove eyes
        if (catterpillarObj.two.leftEye) {
            this.#removeEye(catterpillarObj.two.leftEye)
            catterpillarObj.two.leftEye = null
        }
        if (catterpillarObj.two.rightEye) {
            this.#removeEye(catterpillarObj.two.rightEye)
            catterpillarObj.two.rightEye = null
        }
        
        // remove mouth 
        if (catterpillarObj.two.mouth) {
            this.#removeMouth(catterpillarObj.two.mouth)
            catterpillarObj.two.mouth = null
        }

        this.objects = this.objects.filter(o => o.id !== catterpillarObj.id)

        catterpillarObj.two = null

        if (catterpillarObj.model) {
            catterpillarObj.model.destroy()
            catterpillarObj.model = null
        }
    }
    
    #removeEye(eyeObj: EyeObjectModel) {
        if (!eyeObj) return 
        if (eyeObj.type != "eye") { console.error("Invalid objectModel for #removeEye"); return }

        if (eyeObj.two.group) {
            eyeObj.two.lid.remove()
            eyeObj.two.lid = null

            eyeObj.two.pupil.remove()
            eyeObj.two.pupil = null

            eyeObj.two.group.remove()
            eyeObj.two.group = null
        }

        if (eyeObj.model) {
            eyeObj.model.destroy()
            eyeObj.model = null
        }
    }

    #removeFood(foodObj: FoodObjectModel) {
        console.log("Removing food", foodObj)
        if (!foodObj) return 
        if (foodObj.type != "food") { console.error("Invalid objectModel for #removeFood"); return }

        if (foodObj.two.svg) {
            foodObj.two.svg.remove()
            foodObj.two.svg = null
        }

        if (foodObj.model) {
            foodObj.model.destroy()
            foodObj.model = null
        }
    }
    
    #removeMouth(mouthObj: MouthObjectModel) {
        if (!mouthObj) return 
        if (mouthObj.type != "mouth") { console.error("Invalid objectModel for #removeMouth"); return }

        if (mouthObj.two.path) {
            mouthObj.two.path.remove()
            mouthObj.two.path = null
        }

        if (mouthObj.model) {
            mouthObj.model.destroy()
            mouthObj.model = null
        }
    }

    #removeSpeechBubble(speechBubble: SpeechBubbleObjectModel) {
        if (!speechBubble) return
        if (speechBubble.type != "speechBubble") { console.error("Invalid objectModel for #removeSpeechBubble"); return }

        if (speechBubble.two.bubble) {
            speechBubble.two.bubble.remove()
            speechBubble.two.bubble = null
        }
        
        if (speechBubble.two.anchor) {
            speechBubble.two.anchor.remove()
            speechBubble.two.anchor = null
        }

        if (speechBubble.model) {
            speechBubble.model.destroy()
            speechBubble.model = null
        }

    }

    removeObjectById = (id: number) => {
        const obj = this.objects.find(o => o.id === id)
        this.objects = this.objects.filter(o => o.id !== id)
        if (!obj) return

        if (obj.type == "catterpillar") {
            this.#removeCatterpillar(obj)
            return
        }

        if (obj.type == "ball") {
            this.#removeBall(obj)
            return
        }
        
        if (obj.type == "speechBubble") {
            this.#removeSpeechBubble(obj)
            return
        }
        
    }

}