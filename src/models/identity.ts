export type IdentityField = {
    id: number;            // 29-bit: 23 bits seconds/4 + 6 bits random
    name: string;          // max 16 chars, letters A-Z/a-z + space
    textureIndex: number;     // 0-1023
    colorSchemeIndex: number; // 0-1023
    offset: number;   // 0-15
}

// Generate and encode identity to QR-ready Base45 string of 29 + 96 + 10 + 10 + 4 = 149 bits
export class Identity {
    private static readonly BASE45_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"
    
    // --- Generate 29-bit ID ---
    generateId(): number {
        const now = new Date()
        const yearStart = new Date(now.getFullYear(), 0, 1)
        const secondsSinceYear = Math.floor((now.getTime() - yearStart.getTime()) / 1000)
        const secondsDiv4 = Math.floor(secondsSinceYear / 4) // 23 bits
        const random6 = Math.floor(Math.random() * 64)       // 6 bits
    
        // Combineer 23-bit seconds/4 in de hogere bits met 6-bit random in de lagere bits tot één 29-bit ID
        return (secondsDiv4 << 6) | random6                  // combine to 29-bit ID
    }


    // Encoding
    encode(json: IdentityField): string {
        const identity = this.validateIdentityJSON(json)
        const bytes = this.bitPack(identity)
        return this.base45Encode(bytes)
    }

    // Decoding
    decode(encoded: string): IdentityField {
        this.validateIdentityString(encoded)
        const bytes = this.base45Decode(encoded)
        return this.bitUnpack(bytes)
    }

    // Encoding
    private validateIdentityJSON(json: IdentityField): IdentityField {
        if (typeof json !== "object" || json === null)
            throw new Error("Input must be a non-null object")

        const { id, name, textureIndex, colorSchemeIndex, offset } = json

        if (typeof id !== "number" || id < 0 || id > 0x1FFFFFFF)
            throw new Error("Invalid id: must be 0-536870911 (29-bit)")

        if (typeof name !== "string" || name.length > 16)
            throw new Error("Invalid name: must be string of max 16 chars")

        if (!/^[A-Za-z ]*$/.test(name))
            throw new Error("Invalid name: must contain only letters A-Z/a-z or space")

        if (typeof textureIndex !== "number" || textureIndex < 0 || textureIndex > 1023)
            throw new Error("Invalid textureIndex: must be 0-1023")
        if (typeof colorSchemeIndex !== "number" || colorSchemeIndex < 0 || colorSchemeIndex > 1023)
            throw new Error("Invalid colorSchemeIndex: must be 0-1023")
        if (typeof offset !== "number" || offset < 0 || offset > 15)
            throw new Error("Invalid offset: must be 0-15")

        return { id, name, textureIndex, colorSchemeIndex, offset }
    }

    // Decoding
    private validateIdentityString(encodedString: string): string {
        const BASE45_CHARS = Identity.BASE45_CHARS

        for (const c of encodedString) {
            if (!BASE45_CHARS.includes(c)) {
                throw new Error(`Invalid character in Base45 string: '${c}'`)
            }
        }

        // UPDATE: Totaal is nu 149 bits (was 147)
        // 149 bits / 8 = 18,625 bytes → afgerond naar 19 bytes (nog steeds 19, maar krap aan!)
        const minBytes = Math.ceil(149 / 8) // 19 bytes
        
        const minLength = Math.ceil(minBytes * 3 / 2) 
        if (encodedString.length < minLength) {
            throw new Error(`Base45 string too short: expected at least ${minLength} characters`)
        }

        return encodedString
    }

    // Encoding
    private encodeChar(c: string): number {
        if (c === " ") return 0
        if (c >= "A" && c <= "Z") return c.charCodeAt(0) - 64
        if (c >= "a" && c <= "z") return c.charCodeAt(0) - 70 // a-z => 27-52
        throw new Error(`Invalid char: ${c}`)
    }

    // Decoding
    private decodeChar(code: number): string {
        if (code === 0) return " "
        if (code >= 1 && code <= 26) return String.fromCharCode(code + 64) // A-Z
        if (code >= 27 && code <= 52) return String.fromCharCode(code + 70) // a-z
        throw new Error(`Invalid char code: ${code}`)
    }

    // Encoding
    private push(bits: number[], value: number, size: number): void {
        for (let i = size - 1; i >= 0; i--) {
            bits.push((value >> i) & 1)
        }
    }

    // Decoding
    private unPush(bits: number[], cursor: number, size: number): { value: number; cursor: number } {
        let val = 0
        for (let i = 0; i < size; i++) {
            val = (val << 1) | bits[cursor++]
        }
        return { value: val, cursor }
    }

    // Encoding
    private bitPack(identity: IdentityField): Uint8Array {
        const bits: number[] = []

        // ID: 29 bits
        this.push(bits, identity.id, 29)

        // Name: 16 × 6 bits
        const name = identity.name.padEnd(16, " ")
        for (const c of name) {
            this.push(bits, this.encodeChar(c), 6)
        }

        // textureIndex: 10 bits
        this.push(bits, identity.textureIndex, 10)
        
        // colorSchemeIndex: 10 bits
        this.push(bits, identity.colorSchemeIndex, 10)

        // offset: 4 bits
        this.push(bits, identity.offset, 4)

        // Convert bits to bytes
        const bytes = new Uint8Array(Math.ceil(bits.length / 8))
        bits.forEach((bit, i) => {
            bytes[i >> 3] |= bit << (7 - (i % 8))
        })

        return bytes
    }

    // Decoding
    private bitUnpack(bytes: Uint8Array): IdentityField {

        const bits: number[] = []
        for (let i = 0; i < bytes.length; i++) {
            for (let j = 7; j >= 0; j--) {
                bits.push((bytes[i] >> j) & 1)
            }
        }

        let cursor = 0
        let result


        // ID: 29 bits
        result = this.unPush(bits, cursor, 29)
        const id = result.value
        cursor = result.cursor

        // Name: 16 × 6 bits
        let name = ""
        for (let i = 0; i < 16; i++) {
            result = this.unPush(bits, cursor, 6)
            name += this.decodeChar(result.value)
            cursor = result.cursor
        }
        name = name.trimEnd()

        // textureIndex: 10 bits
        result = this.unPush(bits, cursor, 10)
        const textureIndex = result.value
        cursor = result.cursor

        // colorSchemeIndex: 10 bits
        result = this.unPush(bits, cursor, 10)
        const colorSchemeIndex = result.value
        cursor = result.cursor

        // offset: 4 bits
        result = this.unPush(bits, cursor, 4)
        const offset = result.value
        cursor = result.cursor

        return { id, name, textureIndex, colorSchemeIndex, offset }
    }

    private base45Encode(bytes: Uint8Array): string {
        const chars = Identity.BASE45_CHARS
        let result = ""

        for (let i = 0; i < bytes.length; i += 2) {
            
            if (i + 1 < bytes.length) {
                // Case 1: Twee bytes (16-bit X -> 3 Base45 karakters)
                const x = (bytes[i] << 8) | bytes[i + 1]

                const e = Math.floor(x / (45*45))
                const d = Math.floor((x % (45*45)) / 45)
                const c = x % 45
                
                result += chars[c] + chars[d] + chars[e]
            } else {
                // Case 2: Eén resterende byte (8-bit X -> 2 Base45 karakters)
                const x = bytes[i] // Correct: X is direct de byte waarde

                const d = Math.floor(x / 45)
                const c = x % 45

                result += chars[c] + chars[d]
            }
        }

        return result
    }
    private base45Decode(str: string): Uint8Array {
        const chars = Identity.BASE45_CHARS
        const bytes: number[] = []

        let i = 0
        while (i < str.length) {
            // We hebben altijd minimaal 2 chars nodig voor 1 byte
            const c = chars.indexOf(str[i++])
            const d = chars.indexOf(str[i++])
            
            // Check of er een derde char is
            const hasThirdChar = i < str.length
            let e = 0
            
            if (hasThirdChar) {
                e = chars.indexOf(str[i++])
            }

            const x = c + d * 45 + e * 45 * 45

            if (hasThirdChar) {
                // 3 karakters gelezen = ALTIJD 2 bytes output
                // Ook als de eerste byte 0x00 is (x <= 0xFF)
                bytes.push((x >> 8) & 0xff)
                bytes.push(x & 0xff)
            } else {
                // 2 karakters gelezen = 1 byte output (restant)
                bytes.push(x & 0xff)
            }
        }

        return new Uint8Array(bytes)
    }
}

export default Identity