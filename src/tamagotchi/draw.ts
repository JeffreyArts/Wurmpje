import CatterpillarModel from "@/models/catterpillar"

// eslint-disable-next-line 
const availableBodyPartTextures = [
    "/bodyparts/360/camo",
    "/bodyparts/360/cow",
    "/bodyparts/360/dots",
    "/bodyparts/360/giraffe",
    "/bodyparts/360/leafs",
    "/bodyparts/360/panter",
    "/bodyparts/360/paths",
    "/bodyparts/360/polkadots",
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
]
    
export class Draw {
    // catterpillar: CatterpillarModel
    ref: paper.PaperScope
    objects: Array<{ shape: paper.Item, pos: { x: number, y: number }}> = []

    constructor(ref: paper.PaperScope) {
        this.ref = ref
        // this.catterpillar = catterpillar

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

    addCircle(pos: { x: number, y: number }, { radius, color, name}: { radius: number, color: string, name?: string }): paper.Path.Circle {
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

        return circle
    }

    addCatterpillar(catterpillar: CatterpillarModel, options: { primaryColor: string, secondaryColor: string, svgTextureDir: typeof availableBodyPartTextures[number] }) {

        catterpillar.bodyParts.reverse().forEach((part, index) => {
            let color = index % 2 === 0 ? options.primaryColor : options.secondaryColor
            if (index === catterpillar.bodyParts.length - 1 ) {
                color = "red" // Head color
            }
            this.addCircle(part.body.position, { radius: catterpillar.thickness*.75, color: color, name: `${catterpillar.composite.label}-bodypart-${index}` })
        })
    }
}