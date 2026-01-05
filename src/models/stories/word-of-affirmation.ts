import { watch } from "vue"
import Story from "@/models/story"
import gsap from "gsap"
import { Icon } from "jao-icons"
import { shuffle } from "lodash"

const affirmativeWords = [
    "Amazing",
    "Incredible",
    "Brilliant",
    "Fantastic",
    "Wonderful",
    "Outstanding",
    "Spectacular",
    "Fabulous",
    "Remarkable",
    "Exceptional",
    "Magnificent",
    "Phenomenal",
    "Strong",
    "Capable",
    "Confident",
    "Calm",
    "Focused",
    "Brave",
    "Kind",
    "Worthy",
    "Creative",
    "Resilient",
    "Positive",
    "Grateful",
    "Patient",
    "Curious",
    "Honest",
    "Balanced",
    "Energetic",
    "Mindful",
    "Determined",
    "Optimistic",
    "Grounded",
    "Motivated",
    "Healthy",
    "Loved",
    "Growing",
    "Powerful",
    "Steady",
    "Joyful",
    "Beautiful",
    "Successful",
    "Hopeful",
    "Enough"
]

const hurtfulWords = [
    "Useless",
    "Weak",
    "Stupid",
    "Lazy",
    "Ugly",
    "Hopeless",
    "Incompetent",
    "Worthless",
    "Failure",
    "Pathetic",
    "Disappointing",
    "Clumsy",
    "Cowardly",
    "Selfish",
    "Greedy",
    "Arrogant",
    "Rude",
    "Jealous",
    "Ignorant",
    "Boring",
    "Annoying",
    "Forgetful",
    "Careless",
    "Messy",
    "Impatient",
    "Pessimistic",
    "Negative",
    "Gloomy",
    "Overwhelming",
    "Tiring",
    "Incapable",
    "Insecure",
    "Anxious",
    "Distracted",
    "Fearful",
    "Unkind",
    "Unworthy",
    "Unimaginative",
    "Fragile",
    "Ungrateful",
    "Indifferent",
    "Dishonest",
    "Unbalanced",
    "Exhausted",
    "Mindless",
    "Undecided",
    "Ungrounded",
    "Unmotivated",
    "Unhealthy",
    "Unloved",
    "Stagnant",
    "Powerless",
    "Unsteady",
    "Miserable",
    "Confused",
    "Unsuccessful",
    "Insufficient"
]


class WordsOfAffirmationStory extends Story {
    gameScore = 0
    elements: Array<HTMLElement> = []
    wordScores = [] as Array<{ word: string, score: 1 | 0, svgEl: SVGElement | undefined, x: number, y: number }>
    affirmativeWords = affirmativeWords
    hurtfulWords = hurtfulWords
    fadeOutDuration = 6
    maxWords = 8
    timer = 60
    startTime = 0
    noNewWords = false

    start() {
        console.info("Words of affirmation story started", this.identityStore)

        this.createBackground()
        this.createWordsContainer()
        this.createScoreDisplay()

        this.startTime = Date.now()

        for (let i = 0; i < this.maxWords; i++) {
            setTimeout(() => {
                this.addNewWord()
            }, i * 800 + Math.random() * 400)
        }

        // this.words.push(this.createText("You are doing great!"))
        this.controller.disableDragging = true
    }

    loop() {
        const elapsed = (Date.now() - this.startTime) / 1000
        if (elapsed >= this.timer) {
            this.finish()
        }
    }

    finish() {
        this.noNewWords = true
    }

    pickRandomWord() {

        const totalScore = this.wordScores.reduce((acc, curr) => acc + curr.score, 0)
        let newWord = { word: "", score: 0 as 0 | 1, svgEl: undefined as SVGElement | undefined } 

        // Maak een lijst met mogelijkheden op basis van de score
        let wordOptions = []
        wordOptions.push(...this.hurtfulWords.map(w => ({ word: w, score: 0 })))
        wordOptions.push(...this.affirmativeWords.map(w => ({ word: w, score: 1 })))

        // verwijder al gebruikte woorden
        wordOptions = wordOptions.filter(option => !this.wordScores.find(ws => ws.word === option.word))
        
        if (wordOptions.length === 0) {
            throw new Error("No words available to pick.")
        }

        // sort op score (laag naar hoog)
        wordOptions.sort((a, b) => a.score - b.score)

        // Selecteer een willekeurig woord uit de onderste 2/3 van de lijst
        let randomIndex = Math.round((Math.random() * .667) * wordOptions.length)

        
        if (totalScore <= 1 && this.wordScores.length >= this.maxWords * .75) {
            randomIndex = wordOptions.length - Math.floor((this.affirmativeWords.length) * Math.random())
        }

        // kies een willekeurig woord uit de overgebleven opties
        newWord = { ...wordOptions[randomIndex], svgEl: undefined }
        
        newWord.svgEl = this.createText(newWord.word)
        
        return newWord
    }

    addNewWord() {
        if (this.noNewWords) {
            return
        }

        const newWord = this.pickRandomWord()
        const { x, y } = this.getRandomPosition(newWord.svgEl)
        newWord.svgEl.style.position = "absolute"
        newWord.svgEl.style.left = `${x}px`
        newWord.svgEl.style.top = `${y}px`
        if (newWord.score == 1) { 
            newWord.svgEl.classList.add("__isAffirmative")
        }
        this.wordScores.push({ ...newWord, x, y })
    }

    getRandomPosition(el: SVGElement) {
        const bounds = el.getBoundingClientRect()
        const offset = 32
        const x = Math.random() * ((window.innerWidth - offset * 2) - bounds.width ) + offset
        const y = Math.random() * ((window.innerHeight - offset * 2) - bounds.height ) + offset
        // Loop through all existing words to avoid overlap
        let overlapping = false
        this.wordScores.forEach(wordScore => {
            if (wordScore.svgEl) {
                const wordBounds = wordScore.svgEl.getBoundingClientRect()
                if (!(x + bounds.width < wordBounds.left ||
                    x > wordBounds.right ||
                    y + bounds.height < wordBounds.top ||
                    y > wordBounds.bottom)) {
                    overlapping = true
                }
            }
        })

        if (overlapping) {
            return this.getRandomPosition(el)
        }

        return { x, y }
    }

    removeWord(wordEl: SVGElement) {
        const wordIndex = this.wordScores.findIndex(wordScore => wordScore.svgEl === wordEl)
        gsap.killTweensOf(wordEl)
        if (wordIndex !== -1) {
            this.wordScores.splice(wordIndex, 1)
        }
        if (wordEl.parentNode) {
            wordEl.parentNode.removeChild(wordEl)
        }
        console.log("Word removed", wordEl.getAttribute("data-word"), this.wordScores)
    }

    fadeOutWord(wordEl: SVGElement) {

        const onComplete = () => {
            if (wordEl.parentNode) {
                wordEl.parentNode.removeChild(wordEl)
            }
            this.removeWord(wordEl)
            this.addNewWord()
        } 

        if (!wordEl.classList.contains("__isAffirmative")) {
            const rects = shuffle(wordEl.querySelectorAll("rect[v='1']"))
            const singleDuration = 2        
    
            const tweens: Promise<void>[] = []
            for (let i = 0; i < rects.length; i++) {
                const delay = i * singleDuration * 0.005
                tweens.push(new Promise<void>((resolve) => {
                    gsap.to(rects[i], { fill: "transparent", duration: singleDuration, delay, onComplete: () => {
                        resolve()
                    } })
                }))
            }
            Promise.all(tweens).then(() => {
                onComplete()
            })

            // gsap.to(rects, { fill: "transparent", duration: 1, onComplete, stagger: {
            //     // wrap advanced options in an object
            //     each: 0.05,
            //     from: "center",
            //     grid: "auto",
            //     ease: "power2.inOut",
            // }})
        }

        gsap.to(wordEl, { opacity: 0, duration: this.fadeOutDuration, scale: 0.5, onComplete })
    }
    
    createText(string: string) {
        const textEl = Icon(string, "medium")
        const container = document.querySelector(".wof-words-container")!
        container.appendChild(textEl)
        textEl.classList.add("wof-word")
        textEl.setAttribute("data-word", string)
        textEl.addEventListener("click", this.clickHandler.bind(this))
        gsap.fromTo(textEl, 
            { opacity: 0 }, 
            { opacity: 1, duration: 1, ease: "linear", onComplete: () => {
                this.fadeOutWord(textEl)
            } }
        )
        
        return textEl
    }

    clickHandler(e: PointerEvent) {  
        if (e.currentTarget) {
            const clickedWordEl = e.currentTarget as SVGElement
            const clickedWord = clickedWordEl.getAttribute("data-word")
            const wordData = this.wordScores.find(wordScore => wordScore.word === clickedWord)
            if (wordData) {
                const multiplier = gsap.getProperty(clickedWordEl, "scale") as number
                const wordScore = wordData.score * 20 - 10
                this.gameScore +=  Math.round(wordScore * multiplier)
                // remove word from screen and add new word at same position
                this.removeWord(clickedWordEl)
                this.updateScoreDisplay()
                setTimeout(() => {
                    this.addNewWord()
                }, 500)
            }
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.querySelector(".wof-score-display") as HTMLElement
        if (scoreEl) {
            scoreEl.innerText = `Score: ${this.gameScore}`
        }
    }

    createWordsContainer() {
        const container = document.createElement("div")
        container.classList.add("wof-words-container")
        document.body.appendChild(container)
        this.elements.push(container)
        gsap.to(container.style, { opacity: 1, duration: 1.28 })
    }

    createBackground() {
        const bg = document.createElement("div")
        bg.classList.add("wof-background")
        document.body.appendChild(bg)
        this.elements.push(bg)
        gsap.to(bg, { opacity: 1, duration: 1 })
    }

    createScoreDisplay() {
        const scoreEl = document.createElement("div")
        scoreEl.classList.add("wof-score-display")
        scoreEl.innerText = `Score: ${this.gameScore}`
        document.body.appendChild(scoreEl)
        this.elements.push(scoreEl)
        gsap.to(scoreEl, { opacity: 1, duration: 1 })
    }

    destroy(): void {
        super.destroy()
        this.elements.forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el)
            }
        })

        this.wordScores.forEach(word => {
            if (word.svgEl.parentNode) {
                word.svgEl.parentNode.removeChild(word.svgEl)
            }
        })

        this.wordScores = []
        this.elements = []

        this.controller.disableDragging = false
    }
}

export default WordsOfAffirmationStory