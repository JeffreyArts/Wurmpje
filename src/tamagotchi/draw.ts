import CatterpillarModel from "@/models/catterpillar"
import Color from "@/models/color"
import paper from "paper"
import gsap from "gsap"
 
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
    // catterpillar: CatterpillarModel
    ref: paper.PaperScope
    objects: Array<{ shape: paper.Item, pos: { x: number, y: number }}> = []
    layers: paper.Layer[] = []
    constructor(ref: paper.PaperScope) {
        this.ref = ref
        requestAnimationFrame(this.#draw.bind(this))
    }

    #draw() {
        this.ref.view.update()

        this.objects.forEach(obj => {
            obj.shape.position.x = obj.pos.x
            obj.shape.position.y = obj.pos.y
        })

        requestAnimationFrame(this.#draw.bind(this))
    }

    async #importSVGAsync (urlOrString: string, options: { width: number, height: number, rotate?: number }) : Promise<paper.Item> {
        return new Promise((resolve, reject) => {
            try {
                this.ref.project.importSVG(urlOrString, (item: paper.Item) => {
                    if (!item) {
                        reject("Could not load SVG")
                        return
                    }

                    if (options.width && options.height) {
                        item.scale(options.width / item.bounds.width, options.height / item.bounds.height)
                    }
                    
                    if (options.rotate) {
                        item.rotate(options.rotate)
                    }
                    
                    resolve(item)
                })
            } catch (error) {
                reject(error)
            }
        })
    }
    

    addCircle(pos: { x: number, y: number }, 
        options: { radius: number, color: string, name?: string, strokeWidth?: number, strokeColor?: string },
        layer?: paper.Layer
    ): paper.Path.Circle {
        const { radius, color } = options
        let { name } = options
        if (!name) {
            name = `circle-${Date.now()}`
        }

        const circleOptions = {
            center: new this.ref.Point(pos.x, pos.y),
            radius: radius,
            fillColor: color,
            name: name
        }

        if (options.strokeWidth && options.strokeColor) {
            circleOptions["strokeColor"] = options.strokeColor
            circleOptions["strokeWidth"] = options.strokeWidth
        }

        const circle = new this.ref.Path.Circle(circleOptions)
        this.objects.push({ shape: circle, pos: pos })
        
        if (layer) {
            layer.addChild(circle)
            circle.sendToBack()
        }

        return circle
    }

    addSVG(
        pos: { x: number, y: number }, 
        svgItem: paper.Item,
        layer?: paper.Layer
    ): paper.Item {
        // svgItem.position = new this.ref.Point(pos.x, pos.y)
        this.objects.push({ shape: svgItem, pos: pos })
        
        if (layer) {
            layer.addChild(svgItem)
            svgItem.bringToFront()
        }
        
        return svgItem
    }
    

    async addCatterpillar(catterpillar: CatterpillarModel) {
        const texturePromises = [] 
        const bodyParts = catterpillar.bodyParts
        for (let index = 0; index < bodyParts.length; index++) {
            const part = bodyParts[index]
            const diameter = catterpillar.thickness*1.25
            const primaryColor = new Color(catterpillar.primaryColor)
            const secondaryColor = new Color(catterpillar.secondaryColor)

            // Load texture
            const textures = []
            const svgOptions = { width: diameter, height: diameter } as { width: number, height: number, rotate?: number }
            let svgUrl = ""
            for (const textureType in catterpillar.texture) {
                svgOptions.rotate = undefined
                svgUrl = "./bodyparts/"
                if ( textureType == "360") {
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
                svgUrl += `/${index % 8 + 1 }.svg`

                if (index !== 0) {
                    const svgItem = await this.#importSVGAsync(svgUrl, svgOptions)
                    texturePromises.push(svgItem)
                    svgItem.name = `${catterpillar.composite.label}-texture-${index}-${textureType}`
                    svgItem.opacity = 0
                    svgItem.fillColor = new paper.Color(secondaryColor.toHex())
                    textures.push(svgItem)
                }
            }

            // Create layers if not exist
            const layer = new this.ref.Layer({ name: `layer-${index}` })
            const offset = Math.random() * 0.025
            // Define bodyPart color
            if (index %2 === 0 ) { 
                primaryColor.adjustHsl(0, 0, offset)
                secondaryColor.adjustHsl(0, 0, offset)
            } else {
                primaryColor.adjustHsl(0, 0, -offset)
                secondaryColor.adjustHsl(0, 0, -offset)
            }

            // Add to canvas
            const circleOptions = {
                radius: diameter/2,
                strokeWidth: catterpillar.stroke,
                strokeColor: secondaryColor.toHex(),
                color: primaryColor.toHex(),
                name: `${catterpillar.composite.label}-bodypart-${index}` 
            }

            const circle = this.addCircle(part.body.position, circleOptions, layer)
            circle.opacity = 0
            if (index !== 0) {
                textures.forEach(svgItem => {
                    this.addSVG(part.body.position, svgItem, layer)
                })
            }
            this.layers.push(layer) 
        }

        // Sorteer de lagen op index zodat de juiste volgorde wordt weergegeven
        this.ref.project.layers.sort((a, b) => {
            const indexA = parseInt(a.name.split("-")[2])
            const indexB = parseInt(b.name.split("-")[2])
            return indexB - indexA
        })
        this.ref.project.layers.reverse()
        
        const layers = [...this.ref.project.layers] // kopieer de array
        for (let i = 0; i < layers.length; i++) {
            if (i === 0) {
                layers[i].sendToBack()
            } else {
                layers[i].insertAbove(layers[i - 1])
            }
        }

        this.ref.project.layers.forEach(layer => {
            layer.children.forEach(child => {
                gsap.to(child, { delay: .08, opacity: 1, duration: .16 })
            })
        })
    }
}