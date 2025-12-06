// @ts-nocheck
import CatterpillarModel from "@/models/catterpillar"
import Chroma from "chroma-js"
import gsap from "gsap"
import Two from "two.js"

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

export class Draw {
    two: Two
    objects: Array<{ shape: Two.Shape, pos: { x: number, y: number }, updateVertices?: () => Array<{ x: number, y: number }> }> = []
    layers: Two.Group[] = []

    constructor(two: Two) {
        this.two = two
        requestAnimationFrame(this.#draw.bind(this))
    }

    #draw() {
        this.two.update()
        this.objects.forEach(obj => {
            obj.shape.position.set(obj.pos.x, obj.pos.y)

            if (obj.updateVertices) {
                const verts = obj.updateVertices()

                obj.shape.vertices.forEach((v, i) => {
                    v.x = verts[i].x
                    v.y = verts[i].y
                })
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
        
        this.layers.unshift(bg)
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
        options?: { name?: string },
        layer?: Two.Group
    ): Two.Shape {
        svgItem.position.set(pos.x, pos.y)
        this.objects.push({ shape: svgItem, pos: pos })
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
                    svgItem.opacity = 0
                    svgItem.fill = secondaryColor.hex()
                    textures.push(svgItem)
                }
            }
            // Create layers if not exist
            const layer = this.two.makeGroup() as Two.Group
            layer.name = `layer-${index}`
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
            
            const circle = this.addCircle(part, circleOptions, layer)
            
            circle.opacity = 0
            if (index !== 0) {
                textures.forEach(svgItem => {
                    this.addSVG(part, svgItem, { name: `bodypart-${index}-texture` }, layer)
                })
            }
            if (index === 0) {
                this.addMouth(
                    part,
                    catterpillar.mouth,
                    {
                        // stroke: "#CD2527",
                        // strokeWidth: 2,
                        fill: "#000"
                    },
                    layer
                )

                this.addEye(
                    part,
                    catterpillar.leftEye,
                    layer
                )
                this.addEye(
                    part,
                    catterpillar.rightEye,
                    layer
                )
            }

            this.layers.push(layer)
        }
        // Sorteer de lagen op index zodat de juiste volgorde wordt weergegeven
        this.layers.sort((a, b) => {
            if (!a.name || !b.name) return 0
            const indexA = parseInt(a.name.split("-")[1])
            const indexB = parseInt(b.name.split("-")[1])
            return indexB - indexA
        })
        // Clear all existing layers
        this.two.clear()

        // Voeg lagen toe in de juiste volgorde
        this.layers.forEach(layer => {
            this.two.add(layer)
        })

        this.layers.forEach(layer => {
            if (!layer.children) return
            layer.children.forEach(child => {
                gsap.fromTo(child, { delay: .08, opacity: 0 }, { opacity: 1, duration: .16 })
            })
        })
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

        layer.add(path)
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
        layer.add(eyelid)
        layer.add(eyeGroup)
    }
}