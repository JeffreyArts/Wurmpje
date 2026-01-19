import gsap from "gsap"
import Chroma from "chroma-js"
import ActionStore, { type actionStates } from "@/stores/action"

class Powerbar {
    elements: Array<HTMLElement> = []
    actionStore: ReturnType<typeof ActionStore>
    targetAction: actionStates
    bars: Array<{ el: HTMLElement, perc: number }> = []
    power = 0 // a value between 0 and 1
    powerIndex = 0 // a value of 0 to bars.length
    prevPowerIndex = 0 // a value of 0 to bars.length
    powerPulseTween: gsap.core.Tween | null = null
    onRelease: (power: number) => void
    c1 = Chroma("#eeeeee")
    c2 = Chroma("#ff9900")
    direction = 1

    constructor(onRelease: (power: number) => void) {   
        this.onRelease = onRelease
        this.start()
        this.#loop()
    }
    
    #loop() {

        if (this.powerPulseTween) {
            this.powerIndex = Math.floor(this.power * this.bars.length)
            // console.log(this.prevPowerIndex, this.powerIndex)
           
            for (let i = 0; i < this.bars.length; i++) {
                const bar = this.bars[i]
                let newColor = this.c1.hex()
                if (i === this.powerIndex ) {
                    bar.perc = 1
                    newColor = this.c2.hex()
                }

                if (this.direction === 1 && i <= this.powerIndex) {
                    if (i+1 === this.powerIndex) {
                        bar.perc = bar.perc*.8
                        newColor = Chroma.mix(this.c1, this.c2, bar.perc, "lab").hex()
                    } else if (i+2 === this.powerIndex) {
                        bar.perc = bar.perc*.6
                        newColor = Chroma.mix(this.c1, this.c2, bar.perc, "lab").hex()
                    } 
                    
                } else if (this.direction === -1 && i > this.powerIndex) {
                    if (i-1 === this.powerIndex) {
                        bar.perc = bar.perc*.8
                        newColor = Chroma.mix(this.c1, this.c2, bar.perc, "lab").hex()
                    } else if (i-2 === this.powerIndex) {
                        bar.perc = bar.perc*.6
                        newColor = Chroma.mix(this.c1, this.c2, bar.perc, "lab").hex()
                    }
                }

                this.bars[i].el.style.backgroundColor = newColor
            }

            this.prevPowerIndex = this.powerIndex
        }

        requestAnimationFrame(this.#loop.bind(this))
    }

    async start() {
        document.addEventListener("pointerup", this.fireRelease.bind(this))
        this.createDomElements()
        await this.fadeIn()
        this.movePowerUp()
    }

    fireRelease() {
        this.onRelease(this.power)

        if (this.powerPulseTween) {
            this.powerPulseTween.kill()
            this.powerPulseTween = null
        }

        document.removeEventListener("pointerup", this.fireRelease.bind(this))
        this.fadeOut()
    }

    fadeOut() {
        gsap.to(".powerbar", { opacity: 0, duration: .32 })
        gsap.to(".powerbar .bar", { opacity: 0, duration: .32, stagger: 0.01, onComplete: () => {
            this.destroy()
        } })            
    }

    fadeIn() {
        return new Promise<void>((resolve) => {
            gsap.fromTo(".powerbar .bar", { opacity: 0 }, { opacity: 1, duration: .08, stagger: 0.01, onComplete: () => {
                resolve()
            } })
        })
    }

    async createDomElements() {
        this.bars = []
        const powerbarContainer = document.createElement("div")
        powerbarContainer.classList.add("powerbar")
        document.body.appendChild(powerbarContainer)
        this.elements.push(powerbarContainer)

        for (let i = 0; i < 32; i++) {
            const bar = document.createElement("div")
            bar.classList.add("bar")
            bar.style.height = `${ 6 + (i * 2)}px`
            powerbarContainer.appendChild(bar)
            this.bars.push({ el: bar, perc: 0 })
        }
    }

    movePowerUp() {
        this.direction = 1  // De animatie beweegt vooruit
        this.powerPulseTween = gsap.to(this, { 
            power: 1, 
            duration: 2, 
            ease: "power3.in", 
            onComplete: () => {
                this.movePowerDown()
            }
        })
    }

    movePowerDown() {
        this.direction = -1 // De animatie beweegt achteruit
        this.powerPulseTween = gsap.to(this, { 
            power: 0, 
            duration: 2, 
            ease: "power3.out", 
            onComplete: () => {
                this.movePowerUp()
            }
        })
    }

    // updateBars() {
    //     const activeBars = Math.round(this.power * this.bars.length)
    
    //     this.bars.forEach((bar, index) => {
    //     // If this bar is the active one
    //         if (index === activeBars - 1) {
    //         // Only the bar at `activeBars` should be red
    //             if (!bar.classList.contains("__isActive")) {
    //                 bar.classList.add("__isActive")
    //                 gsap.killTweensOf(bar)
    //                 gsap.to(bar, { backgroundColor: "#ff9900", duration: 0.24 })
    //             }
    //         } else {
    //         // For all other bars, reset to inactive state
    //             if (bar.classList.contains("__isActive")) {
    //                 gsap.killTweensOf(bar)
    //                 gsap.to(bar, {
    //                     backgroundColor: "pink", // Replace with your inactive color
    //                     duration: 1,
    //                     onComplete: () => {
    //                         bar.classList.remove("__isActive")
    //                     }
    //                 })
    //             } else {
    //             }
    //         }
    //     })
    // }



    destroy(): void {
        this.bars.forEach(bar => {
            gsap.killTweensOf(bar.el)

            if (bar.el.parentNode) {
                bar.el.parentNode.removeChild(bar.el)
            }
        })

        this.elements.forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el)
            }
        })

        this.elements = []
    }
}

export default Powerbar