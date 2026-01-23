import gsap from "gsap"
import ActionStore, { type actionStates } from "@/stores/action"

class Score {
    type = "action" as const
    elements: Array<HTMLElement> = []
    actionStore: ReturnType<typeof ActionStore>
    targetAction: actionStates
    value: number = 0
    maxScore: number = 0

    constructor(targetAction: actionStates, maxScore: number) {   
        this.actionStore = ActionStore()

        this.targetAction = targetAction
        this.maxScore = maxScore

        this.start()
    }
    
    #loop() {
        const scoreEl = this.elements.find(el => el.classList.contains("score-display"))
        if (scoreEl) {
            scoreEl.innerText = `${this.value}`
        }

        requestAnimationFrame(this.#loop.bind(this))
    }

    async start() {
        this.createDisplay()
        this.#loop()
    }

    updateScore(newValue: number) {
        this.value = newValue
    }
    
    createDisplay() {
        // Don't create multiple score displays
        if (this.elements.find(el => el.classList.contains("score-display"))) return

        const scoreEl = document.createElement("div")
        scoreEl.classList.add("score-display")
        
        document.body.appendChild(scoreEl)
        this.elements.push(scoreEl)
        gsap.to(scoreEl, { opacity: 1, duration: 1 })
    }

    async createScorefix() {
        const bad = [ "Pathetic", "Weak", "Disappointing", "Bad", "Mediocre", "Awful"]
        const good = [ "Okay", "Decent", "Nice", "Good"]
        const great = [ "Amazing", "Incredible", "Brilliant", "Fantastic", "Wonderful", "Outstanding", "Spectacular", "Remarkable", "Exceptional", "Magnificent", "Phenomenal", "Great"]
        const prefixes = [ "Pretty", "You are", "That was"]

        
        let randomAffirmative = ""
        
        if (this.value < (this.maxScore * 0.4)) {
            randomAffirmative = bad[Math.floor(Math.random() * bad.length)]
        } else if (this.value < (this.maxScore * 0.8)) {
            randomAffirmative = good[Math.floor(Math.random() * good.length)]
        } else {
            randomAffirmative = great[Math.floor(Math.random() * great.length)] + "!"
        }

        
        const scorefixEl = document.createElement("div")
        scorefixEl.classList.add("scorefix")
        document.body.appendChild(scorefixEl)

        // Create title
        const titleEl = document.createElement("h1")
        titleEl.classList.add("scorefix-title")
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
        titleEl.innerHTML = `${prefix}<br />${randomAffirmative}`
        scorefixEl.appendChild(titleEl)

        // Create score
        const scoreEl = document.createElement("strong")
        scoreEl.classList.add("scorefix-score")
        scoreEl.innerText = "Points"
        scorefixEl.appendChild(scoreEl)

        this.elements.push(scorefixEl)
        gsap.fromTo(scorefixEl, { opacity: 0 }, { opacity: 1, duration: 1 })
    }

    showFinalScore() {
        return new Promise<void>((resolve) => {
            // Animate score display to center
            gsap.to(".score-display", { 
                fontWeight: "500",
                letterSpacing: "0px",
                top: "33%",
                right: "calc(50% - 64px)",
                rotate: 0,
                textAlign: "center",
                duration: 1,
                onComplete: () => {
                    this.createScorefix()
                    resolve()
                }
            })
        })
    }

    destroy(): void {
        this.elements.forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el)
            }
        })

        this.elements = []
    }
}

export default Score