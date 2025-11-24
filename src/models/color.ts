class Color {
    private r: number
    private g: number
    private b: number

    constructor(hex: string) {
        const { r, g, b } = Color.hexToRgb(hex)
        this.r = r
        this.g = g
        this.b = b
    }

    // --- HEX ↔ RGB ---
    static hexToRgb(hex: string) {
        hex = hex.replace("#", "")
        if (hex.length === 3) {
            hex = hex.split("").map(h => h + h).join("")
        }
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return { r, g, b }
    }

    static rgbToHex({ r, g, b }: { r: number; g: number; b: number; }) {
        return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")
    }

    // --- RGB ↔ HSL ---
    private rgbToHsl() {
        const r = this.r / 255, g = this.g / 255, b = this.b / 255
        const max = Math.max(r, g, b), min = Math.min(r, g, b)
        let h = 0, s = 0, l = (max + min) / 2

        const d = max - min
        s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))

        if (d !== 0) {
            switch (max) {
            case r: h = ((g - b) / d) % 6; break
            case g: h = (b - r) / d + 2; break
            case b: h = (r - g) / d + 4; break
            }
            h = Math.round(h * 60)
            if (h < 0) h += 360
        }

        return { h, s, l }
    }

    private hslToRgb({ h, s, l }: { h: number; s: number; l: number; }) {
        const c = (1 - Math.abs(2 * l - 1)) * s
        const x = c * (1 - Math.abs((h / 60) % 2 - 1))
        const m = l - c / 2
        let r1 = 0, g1 = 0, b1 = 0

        if (h < 60) { r1 = c; g1 = x; b1 = 0 }
        else if (h < 120) { r1 = x; g1 = c; b1 = 0 }
        else if (h < 180) { r1 = 0; g1 = c; b1 = x }
        else if (h < 240) { r1 = 0; g1 = x; b1 = c }
        else if (h < 300) { r1 = x; g1 = 0; b1 = c }
        else { r1 = c; g1 = 0; b1 = x }

        this.r = Math.round((r1 + m) * 255)
        this.g = Math.round((g1 + m) * 255)
        this.b = Math.round((b1 + m) * 255)
    }

    // --- HSL manipulaties ---
    adjustHsl(dh = 0, ds = 0, dl = 0) {
        const { h, s, l } = this.rgbToHsl()
        const newH = (h + dh) % 360
        const newS = Math.min(1, Math.max(0, s + ds))
        const newL = Math.min(1, Math.max(0, l + dl))
        this.hslToRgb({ h: newH, s: newS, l: newL })
        return this // chainable
    }

    // --- Getters ---
    toHex() {
        return Color.rgbToHex({ r: this.r, g: this.g, b: this.b })
    }

    toRgb() {
        return { r: this.r, g: this.g, b: this.b }
    }

    toHsl() {
        return this.rgbToHsl()
    }
}
export default Color