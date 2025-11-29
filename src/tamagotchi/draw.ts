import CatterpillarModel from "@/models/catterpillar"
import Color from "@/models/color"
import paper from "paper"

 
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
        options: { radius: number, color: string, name?: string },
        layer?: paper.Layer
    ): paper.Path.Circle {
        const { radius, color } = options
        let { name } = options
        if (!name) {
            name = `circle-${Date.now()}`
        }

        
        const circle = new this.ref.Path.Circle({
            center: new this.ref.Point(pos.x, pos.y),
            radius: radius,
            fillColor: color,
            name: name
        })
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

    addCatterpillar(catterpillar: CatterpillarModel, options: { primaryColor: string, secondaryColor: string, svgTextureDir: typeof availableBodyPartTextures[number] }) {


        catterpillar.bodyParts.reverse().forEach(async (part, index) => {
            const diameter = catterpillar.thickness*1.25
            const primaryColor = new Color(options.primaryColor)
            const secondaryColor = new Color(options.secondaryColor)


            // Load texture
            const svgOptions = { width: diameter, height: diameter } as { width: number, height: number, rotate?: number }
            if (options.svgTextureDir.indexOf("360") !== -1) {
                svgOptions.rotate = index * (360 / catterpillar.bodyParts.length)
            }
            const svgUrl = `${options.svgTextureDir}/${index % 8 + 1 }.svg`
            const svgItem = await this.#importSVGAsync(svgUrl, svgOptions)
            svgItem.fillColor = new paper.Color(secondaryColor.toHex())

            // Create layers if not exist
            const layer = new this.ref.Layer()

            // Define bodyPart color
            if (index %2 === 0 ) { 
                primaryColor.adjustHsl(0, 0, Math.random() * 0.025)
            } else {
                primaryColor.adjustHsl(0, 0, -Math.random() * 0.025)
            }

            // Add to canvas
            this.addCircle(part.body.position, { radius: diameter/2, color: primaryColor.toHex(), name: `${catterpillar.composite.label}-bodypart-${index}` }, layer)
            this.addSVG(part.body.position, svgItem, layer)
            this.layers.push(layer) 
        })
    }
}