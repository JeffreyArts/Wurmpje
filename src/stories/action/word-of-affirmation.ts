import Story from "@/stories/_base"
import gsap from "gsap"
import { Icon } from "jao-icons"
import { shuffle } from "lodash"
import Leaderboard from "@/models/leaderboard"
import Score from "@/models/score"

const affirmativeWords = [
    "Fantastic",
    "Amazing",
    "Incredible",
    "Brilliant",
    "Wonderful",
    "Outstanding",
    "Spectacular",
    "Remarkable",
    "Exceptional",
    "Magnificent",
    "Phenomenal",
    "Terrific",
    "Fabulous",
    "Excellent",
    "Great",
    "Good",
    "Humble",
    "Kind",
    "Caring",
    "Compassionate",
    "Generous",
    "Loving",
    "Thoughtful",
    "Patient",
    "Understanding",
    "Supportive",
    "Encouraging",
    "Optimistic",
    "Cheerful",
    "Joyful",
    "Sweet",
    "Grateful",
    "Reliable",
    "Trustworthy",
    "Honest",
    "Respectful",
    "Friendly",
    "Creative",
    "Imaginative",
    "Adventurous",
    "Curious",
    "Hardworking",
    "Determined",
    "Resilient",
    "Brave",
    "Confident",
    "Enough",
    "Vulnerable",
]

const hurtfulWords = [
    "Useless",
    "Weak",
    "Stupid",
    "Lazy",
    "Ugly",
    "Hopeless",
    "Incompetent",
    "Limited",
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
    "Needy",
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
    "Invisible",
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
    type = "action" as const
    elements: Array<HTMLElement> = []
    wordScores = [] as Array<{ word: string, score: 1 | 0, svgEl: SVGElement | undefined, x: number, y: number }>
    affirmativeWords = affirmativeWords
    hurtfulWords = hurtfulWords
    fadeOutDuration = 6
    maxWords = 3
    timer = 60
    prevTime = 0
    startTime = 0
    noNewWords = false
    newWordTimeout = null as ReturnType<typeof setTimeout> | null
    leaderboard = undefined as Leaderboard | undefined
    score = new Score("wof-score", 666 )
    isReady = false

    async start() {   
        console.info("🐛 Words of affirmation story started", this)

        this.createBackground()
        this.createWordsContainer()
        this.createtimer()
        this.createScoreDisplay()

        this.startTime = Date.now()
        this.actionStore.isSelected = false

        this.controller.disableDragging = true

        await this.actionStore.add(this.identityStore.current.id, "wof", 1) // register a try, value is irrelevant
        await this.actionStore.loadAvailableWOFtries(this.identityStore.current.id)
        this.isReady = true
    }

    loop = () => {
        if (!this.isReady) {
            return
        }
        console.log("Words of Affirmation story loop", this.startTime)
        if (this.noNewWords) {
            return
        }

        if (this.wordScores.length < this.maxWords && !this.newWordTimeout) {
            this.newWordTimeout = setTimeout(() => {  
                if (this.wordScores.length < this.maxWords) {
                    this.addNewWord()
                }
                clearTimeout(this.newWordTimeout)
                this.newWordTimeout = null
            }, Math.random() * 200 + 100)
        }

        const elapsed = (Date.now() - this.startTime) / 1000
        if (this.prevTime !== Math.ceil(elapsed)) {
            if (this.prevTime%10 === 0 ) {
                this.maxWords ++
            }
            this.updateTimerDisplay()
        }


        if (elapsed >= this.timer) {
            this.noNewWords = true
            setTimeout(() => {
                this.finish()
            })
        }

        this.prevTime = Math.ceil(elapsed)
    }

    async finish() {
        this.noNewWords = true

        // Fade out all words
        this.wordScores.forEach(wordScore => {
            if (wordScore.svgEl) {
                gsap.killTweensOf(wordScore.svgEl)
                gsap.to(wordScore.svgEl, { opacity: 0, duration: 1, onComplete: () => {
                    this.removeWord(wordScore.svgEl)
                } })
            }
        })

        // Fade out timer
        gsap.to(".wof-timer", { opacity: 0, duration: 1 })

        await this.score.showFinalScore()

        this.leaderboard = new Leaderboard("wof-score", this.score.value, this.endStory.bind(this), { fadeInBackground: false } )
        const bg = document.querySelector(".wof-background") as HTMLElement
        bg.style.opacity = "0"

    }

    async endStory() {        
        gsap.to(".wof-scorefix-score", { opacity: 0, duration: .8, delay: 0 })
        gsap.to(".wof-score-display", { opacity: 0, duration: .8, delay: 0.2 })
        gsap.to(".wof-scorefix-title", { opacity: 0, duration: .8, delay: 0.4 , onComplete: () => {
            this.destroy()
            this.identityStore.current.love = Math.min(this.identityStore.current.love + loveValue, 100)
        } })
        
        this.score.destroy()
        this.leaderboard.destroy()
        this.storyStore.killStory("wof")
        const loveValue = Math.floor(this.score.value/100)
        await this.actionStore.add(this.identityStore.current.id, "love", loveValue )
        
    }
    
    pickRandomWord() {
        const totalScore = this.wordScores.reduce((acc, curr) => acc + curr.score, 0)
        let newWord = { word: "", score: 0 as 0 | 1, svgEl: undefined as SVGElement | undefined } 

        // Maak een lijst met mogelijkheden op basis van de score
        let wordOptions = []
        wordOptions.push(...shuffle(this.affirmativeWords.map(w => ({ word: w, score: 1 }))))
        wordOptions.push(...shuffle(this.hurtfulWords.map(w => ({ word: w, score: 0 }))))

        // verwijder al gebruikte woorden
        wordOptions = wordOptions.filter(option => !this.wordScores.find(ws => ws.word === option.word))
        
        if (wordOptions.length === 0) {
            throw new Error("No words available to pick.")
        }

        // sort op score (laag naar hoog)
        // wordOptions.sort((a, b) => a.score - b.score)

        const positiveRatio = this.affirmativeWords.length/wordOptions.length
        const ratio = positiveRatio * 1.2 // 20% is kans op een negatief woord, 80% kans op een positief woord

        // Selecteer een willekeurig woord uit 2/3 van de lijst (dat betekend meestal positief)
        let randomIndex = Math.floor(Math.random() * ratio * wordOptions.length)

        // Forceer altijd ten minste één positief woord
        if (totalScore < 1) {
            randomIndex = 0
        }

        // kies een willekeurig woord uit de overgebleven opties
        newWord = { ...wordOptions[randomIndex], svgEl: undefined }
        
        if (!newWord.word) {
            newWord = { ...wordOptions[0], svgEl: undefined }
        }
        
        newWord.svgEl = this.createText(newWord.word)
        
        return newWord
    }

    addNewWord() {
        if (this.noNewWords) {
            return
        }
        const container = document.querySelector(".wof-words-container")!
        if (!container) {
            return
        }

        const newWord = this.pickRandomWord()
        const pos = this.getRandomPosition(newWord.svgEl)
        if (!pos) {
            this.removeWord(newWord.svgEl)
            return
        }
        const { x, y } = pos
        newWord.svgEl.style.position = "absolute"
        newWord.svgEl.style.left = `${x}px`
        newWord.svgEl.style.top = `${y}px`
        if (newWord.score == 1) { 
            newWord.svgEl.classList.add("__isAffirmative")
        }
        
        gsap.fromTo(newWord.svgEl, { opacity: 0 }, { opacity: 1, delay: 1, duration: .4, ease: "power3.in", onComplete: () => {
            this.fadeOutWord(newWord.svgEl)
        } })

        this.wordScores.push({ ...newWord, x, y })
    }

    getRandomPosition(el: SVGElement, tries=0) {
        if (tries > 100) {
            return undefined
        }
        const bounds = el.getBoundingClientRect()
        const offset = 32
        const x = Math.random() * ((window.innerWidth - offset) - bounds.width ) + offset / 2
        const y = Math.random() * ((window.innerHeight - offset) - bounds.height ) + offset / 2
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

        // Check if overlapping with .wof-timer or .wof-score-display
        const timerEl = document.querySelector(".wof-timer")
        const scoreEl = document.querySelector(".wof-score-display")
        if (timerEl) {
            const timerBounds = timerEl.getBoundingClientRect()
            if (!(x + bounds.width < timerBounds.left ||
                x > timerBounds.right ||
                y + bounds.height < timerBounds.top ||
                y > timerBounds.bottom)) {
                overlapping = true
            }
        }

        if (scoreEl) {
            const scoreBounds = scoreEl.getBoundingClientRect()
            if (!(x + bounds.width < scoreBounds.left ||
                x > scoreBounds.right ||
                y + bounds.height < scoreBounds.top ||
                y > scoreBounds.bottom)) {
                overlapping = true
            }
        }

        if (overlapping) {
            return this.getRandomPosition(el, tries+1)
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

        gsap.to(wordEl, { opacity: 0, delay: .5, duration: this.fadeOutDuration, ease: "linear", scale: 0.5, onComplete })
    }
    
    createText(string: string) {
        const textEl = Icon(string, "medium")
        const container = document.querySelector(".wof-words-container")!
        container.appendChild(textEl)
        textEl.classList.add("wof-word")
        textEl.setAttribute("data-word", string)
        textEl.addEventListener("click", this.clickHandler.bind(this))

        return textEl
    }

    clickHandler(e: PointerEvent) {  

        if (this.noNewWords) {
            return
        }

        if (e.currentTarget) {
            const clickedWordEl = e.currentTarget as SVGElement
            const clickedWord = clickedWordEl.getAttribute("data-word")
            const wordData = this.wordScores.find(wordScore => wordScore.word === clickedWord)
            if (wordData) {
                const multiplier = gsap.getProperty(clickedWordEl, "scale") as number
                const wordScore = wordData.score * 20 - 10
                this.score.value +=  Math.round(wordScore * multiplier)
                
                // remove word from screen and add new word at same position
                gsap.killTweensOf(clickedWordEl)
                let color = "currentColor"
                if (wordScore > 0) {
                    color = "#ff9900"
                }
                this.removeWord(clickedWordEl)
                gsap.to(clickedWordEl, { opacity: 0, duration: 0.5, color, ease: "power2.out", onComplete: () => {
                    this.addNewWord()
                } })
            }
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

    updateTimerDisplay() {
        const timerEl = document.querySelector(".wof-timer") as HTMLElement
        if (timerEl && this.prevTime !== undefined) {
            let timerString = (this.timer - this.prevTime).toString()
            if (timerString.length < 2) {
                timerString = "0" + timerString
            }
            
            const seconds = timerString[1]
            const newSecondsSVG = Icon(seconds, "small")
            const oldSecondsRects = document.querySelectorAll(".wof-timer-seconds rect")

            oldSecondsRects.forEach((oldRect) => {
                const newRect = newSecondsSVG.querySelector(`rect[x='${oldRect.getAttribute("x")}'][y='${oldRect.getAttribute("y")}']`) as SVGRectElement
                // The "1" is one column less than the rest of the numbers
                
                if (newRect?.getAttribute("v") == "1") {
                    gsap.to(oldRect, { fill: "#fff", duration: 0.5 })
                } else {
                    gsap.to(oldRect, { fill: "transparent", duration: 0.5 })
                }
            })
            
            const tenths = timerString[0]
            const newTenthsSVG = Icon(tenths, "small")
            const oldTenthRects = document.querySelectorAll(".wof-timer-tenths rect")
            
            oldTenthRects.forEach((oldRect) => {
                const newRect = newTenthsSVG.querySelector(`rect[x='${oldRect.getAttribute("x")}'][y='${oldRect.getAttribute("y")}']`) as SVGRectElement
        
                if (newRect?.getAttribute("v") == "1") {
                    gsap.to(oldRect, { fill: "#fff", duration: 0.5 })
                } else {
                    gsap.to(oldRect, { fill: "transparent", duration: 0.5 })
                }
            })
        }
    }

    createtimer() {
        const timerEl = document.createElement("div")
        timerEl.classList.add("wof-timer")
        let timerString = this.timer.toString()
        if (timerString.length < 2) {
            timerString = "0" + timerString
        }
        const tenths = timerString[0]
        const seconds = timerString[1]

        const secondsEl = document.createElement("span")
        secondsEl.classList.add("wof-timer-seconds")
        secondsEl.appendChild(Icon(seconds, "small"))
        
        const tenthsEl = document.createElement("span")
        tenthsEl.classList.add("wof-timer-tenths")
        tenthsEl.appendChild(Icon(tenths, "small"))

        timerEl.appendChild(tenthsEl)
        timerEl.appendChild(secondsEl)

        document.body.appendChild(timerEl)
        gsap.to(timerEl, { opacity: 1, duration: 1 })
        this.elements.push(timerEl)
    }

    createScoreDisplay = () => {
        this.score.createDisplay()
        setTimeout(() => {
            gsap.set(".score-display", { color: "#fff" })
        })
    }


    destroy = () => {
        console.info("📕 Words of Affirmation story finished")

        
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
        
        if (this.controller) {
            this.controller.disableDragging = false
        }

        if (this.score) { this.score.destroy() }
        if (this.leaderboard) { this.leaderboard.destroy() }

        // Process the default story destroy
        super.destroy()
    }
}

export default WordsOfAffirmationStory