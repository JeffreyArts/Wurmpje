import gsap from "gsap"
import ActionStore, { type actionStates } from "@/stores/action"

class Leaderboard {
    type = "action" as const
    gameScore: number
    elements: Array<HTMLElement> = []
    actionStore: ReturnType<typeof ActionStore>
    targetAction: actionStates
    isLoaded: boolean = false
    onClose: () => void

    constructor(targetAction: actionStates, gameScore: number, onClose: () => void, options?: { fadeInBackground?: boolean }) {   
        this.actionStore = ActionStore()
        
        this.targetAction = targetAction
        this.gameScore = gameScore
        this.onClose = onClose
        this.start(options)
    }
    
    async start(options: { fadeInBackground?: boolean } = {}) {
        let fadeInBackground = true
        if (options.fadeInBackground !== undefined) {
            fadeInBackground = options.fadeInBackground 
        }

        this.createBackground(fadeInBackground)
        await this.actionStore.add(1, this.targetAction, this.gameScore)
        await this.createLeaderboard()

    }

    fadeOut = () => {
        if (!this.isLoaded) return

        gsap.to(".leaderboard tr", { opacity: 0, duration: .8, stagger: 0.1 })            
        gsap.to(".leaderboard-bg", { opacity: 0, duration: 1, delay: 1, ease: "power3.in", onComplete: () => {
            if (this.onClose) {
                this.onClose()
            }
        
            const bg = this.elements.find(el => el.classList.contains("leaderboard-bg"))
            if (bg && bg.parentNode) {
                bg.removeEventListener("click", this.fadeOut)
            }
            this.destroy()
        } })
    }

    fadeIn() {
        gsap.fromTo(".leaderboard tr", { opacity: 0 }, { opacity: 1, duration: .8, stagger: { 
            each: 0.1,
            from: "end",
            onComplete: () => {
                this.isLoaded = true
            }
        }, delay: 1 })
    }

    createBackground(fadeIn: boolean) {
        const bg = document.createElement("div")
        bg.classList.add("leaderboard-bg")
        document.body.appendChild(bg)
        this.elements.push(bg)
        bg.addEventListener("click", this.fadeOut)

        if (!fadeIn) return
        bg.style.opacity = "0"
        gsap.to(bg, { opacity: 1, duration: 1 })
    }

    async createLeaderboard() {
        const leaderboardEl = document.createElement("div")
        leaderboardEl.classList.add("leaderboard")
        document.body.appendChild(leaderboardEl)
        this.elements.push(leaderboardEl)

        // Create table 
        const tableEl = document.createElement("table")
        tableEl.setAttribute("cellspacing", "0")
        tableEl.setAttribute("cellpadding", "0")

        // Create table header
        const theadEl = document.createElement("thead")
        const headerRowEl = document.createElement("tr")
        const dateHeaderEl = document.createElement("th")
        dateHeaderEl.innerText = "Date"
        const scoreHeaderEl = document.createElement("th")
        scoreHeaderEl.innerText = "Score"
        headerRowEl.appendChild(dateHeaderEl)
        headerRowEl.appendChild(scoreHeaderEl)
        theadEl.appendChild(headerRowEl)
        tableEl.appendChild(theadEl)

        // Load latest 5 scores
        const tbodyEl = document.createElement("tbody")
        
        let scores = await this.actionStore.loadLastActionsFromDB(1, this.targetAction, 5, (a, b) => b.value - a.value)
        if (!Array.isArray(scores)) { 
            scores = [scores]
        }

        scores.forEach(score => {
            const rowEl = document.createElement("tr")
            const dateEl = document.createElement("td")
            const scoreValueEl = document.createElement("td")
            const date = new Date(score.created)

            // if date is less than 10 seconds ago, set currentScore to true
            const currentScore = (Date.now() - score.created) < 10000
            if (currentScore) {
                rowEl.classList.add("__isCurrentScore")
            }
            
            // Show date as DD-MM-YYY
            dateEl.innerHTML = `<span class="date">${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear().toString().padStart(4, "0")}</span>`

            // If score is a week old, show time as well
            const oneWeek = 7 * 24 * 60 * 60 * 1000
            if (Date.now() - score.created < oneWeek) {
                
                // Show time as HH:MM
                dateEl.innerHTML += `<span class="time">${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}</span>`
            }
            
            scoreValueEl.innerText = score.value.toString()
            rowEl.appendChild(dateEl)
            rowEl.appendChild(scoreValueEl)
            tbodyEl.appendChild(rowEl)
        })
        

        if (scores.length > 0) {
            tableEl.appendChild(tbodyEl)
        }

        leaderboardEl.appendChild(tableEl)

        this.fadeIn()
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

export default Leaderboard