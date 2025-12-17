<template>
    <div class="scan-page">

        <router-link class="page-go-back" to="/">
            <jao-icon name="chevron-left-fat" size="small" inactive-color="transparent" active-color="currentColor"/>
            <span>Go back</span>
        </router-link>

        <div class="loader">
            <jao-icon name="heart" id="loader" size="medium" inactive-color="transparent" active-color="currentColor"/>
        </div>

        <div class="qr-scanner-container">
            <video id="qr-scanner"></video>
        </div>
        

        <div class="scan-page-view-finder">
            <span class="story-line-message">
                {{ message.text }}
            </span>

            <div class="view-finder"></div>

            <div class="progressbar">
                <span class="bar" v-for="i in 48" :key="i"></span>    
            </div>


            <footer class="scan-page-view-finder-actions">
                <i class="jao-icon">
                    <jao-icon name="redo" size="medium" inactive-color="transparent" active-color="var(--contrast-color)"/>
                    <span>try different code</span>    
                </i>
            </footer>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import matterBox from "@/components/matter-box.vue"
import jaoIcon from "@/components/jao-icon.vue"
import gsap from "gsap"
import QrScanner from "qr-scanner"

export default defineComponent({
    name: "setupPage",
    components: {
        matterBox,
        // Modal,
        jaoIcon,
    },
    props: [],
    setup() {
        try {
            const identityStore = useIdentityStore()
            identityStore.init()

            return {
                identity: identityStore,
            }
        } catch (e) {
            console.error("Failed to initialise identity store:", e)
        }
    },
    data() {
        return {
            message: {
                x: 0,
                y: 0,
                text: "",
                width: 0 as number | string,
                rotation: 0,
            },
            qrScanner: null as QrScanner | null,
            lastScans: [] as Array<{timestamp: number; data: string}>,
            
            scanStories: [
                [
                    "Hey! I see something",
                    "Try to center the QR code in the camera view.",
                ],
                [
                    "Getting closer!",
                    "Make sure there's enough light and hold your device steady.",
                ],
                [
                    "Hmmmm...",
                    "Let's have another look",
                    "Keep it steady, we're almost ready.",
                    "Almost there!",
                ],
                [
                    "Hold on tight!",
                    "Don't move too fast, we need a clear view.",
                    "That's it, just a bit more...",
                ],
                [
                    "Nice work!",
                    "You're doing great, just a bit closer..."
                ],
                [
                    "Focus mode activated",
                    "💮🧘‍♀️💮",
                    "Slowly...",
                    "Almost there..."
                ],
                [
                    "Getting a clear shot",
                    "Steady now, you’ve got this!",
                    "Patience.. it's almost perfect."
                ],
                [
                    "I think I saw one!",
                ],
                [
                    "Hmmmm... Let's focus",
                    "A little bit more",
                    "A bit more...",
                ],
            ] as Array<Array<string>>,
            successLines: [
                "🔥🔥🔥",
                "💪🐛",
                "Found one!",
                "I found one!",
                "YEAH!! I found one!",
            ] as Array<string>,
            failureLines: [
                "Nope",
                "Maybe you can find a wurmpje in a different QR code?",
                "I don't see a wurmpje here",
                "Maybe one is hidden in another QR code?",
                "Sorry, no wurmpje here",
                "Can't find a wurmpje here",
                "🙂‍↔️",
            ] as Array<string>,
            storyLine: [] as Array<string>,
            storyLineIndex: 0,
            
            readyForNextScan: true,
            progress: 0,
            
            postponeLines: [
                "Hold a QR code in front of the camera",
                "The QR code should be in the center of the screen",
                "Scanning from a screen? Try decreasing the brightness",
            ] as Array<string>,
            postponeIndex: 0,
            postponeTimeout: null as NodeJS.Timeout | null,
        }
    },
    head: {
        title: "Scan QR Code",
        meta: [
            {
                name: "description",
                content:
                    "Scan a QR code to breed your own Wurmpje, your personal digital pet!",
            },
        ],
    },
    async mounted() {
        this.beatingHeart()
        this.storyLine = this.scanStories[ Math.floor(Math.random() * this.scanStories.length) ]

        // await this.identity.initialised

        const videoEl = document.getElementById(
            "qr-scanner",
        ) as HTMLVideoElement
        this.qrScanner = new QrScanner(
            videoEl,
            this.onScan,
            {
                maxScansPerSecond: 8,
                highlightScanRegion: true,
                highlightCodeOutline: true,
                calculateScanRegion: () => {
                    const video = this.$el.querySelector('#qr-scanner') as HTMLVideoElement;

                    if (!video.videoWidth || !video.videoHeight) {
                        return {
                            x: 0,
                            y: 0,
                            width: 1,
                            height: 1,
                        };
                    }

                    const size = Math.min(video.videoWidth, video.videoHeight);

                    return {
                        x: (video.videoWidth - size) / 2,
                        y: (video.videoHeight - size) / 2,
                        width: size,
                        height: size,
                    };
                },
            },
        )

        // Kill hear tween
        this.qrScanner.start();
        setTimeout(() => {
            gsap.killTweensOf(this.$el.querySelector("#loader"))
            // gsap.killTweensOf(this.$el.querySelector("#loader"));
            gsap.to(this.$el.querySelector("#loader"), {duration: 0.3, opacity: 0});
            gsap.to(this.$el.querySelector("#qr-scanner"), {duration: 0.3, opacity: 1});
            gsap.to(".scan-page-view-finder", {duration: 2, delay: .4, opacity: 1});
        }, 2000)

        this.setPostponeTimer()
    },
    methods: {
        beatingHeart() {
            const heart = this.$el.querySelector("#loader")
            if (heart) {
                gsap.fromTo(
                    heart,
                    { scale: 1 },
                    {
                        scale: 1.44,
                        duration: 0.8,
                        yoyo: true,
                        repeat: -1,
                        ease: "elastic.out(1, 0.3)",
                    },
                )
            }
        },
        calculateDimensions(cornerPoints: Array<{x: number, y: number}>) {
            if (cornerPoints.length < 4) {
                return { width: 0, height: 0 }
            }

            const qrScannerEl = this.$el.querySelector("#qr-scanner") as HTMLVideoElement
            const scanRegionHighlightEl = this.$el.querySelector(".scan-region-highlight-svg") as SVGElement
            

            const canvasWidth = scanRegionHighlightEl.clientWidth
            const canvasHeight = scanRegionHighlightEl.clientHeight
            
            const resizedPoints = cornerPoints.map(point => ({
                x: point.x - (qrScannerEl.videoWidth - qrScannerEl.videoHeight) / 2,
                y: point.y ,
            }))


            let width = 0
            {
                const dx = cornerPoints[1].x - cornerPoints[0].x
                const dy = cornerPoints[1].y - cornerPoints[0].y
                width = Math.abs(Math.sqrt(dx*dx + dy*dy))
            }

            let height = 0
            {
                const dx = cornerPoints[3].x - cornerPoints[0].x
                const dy = cornerPoints[3].y - cornerPoints[0].y
                height = Math.abs(Math.sqrt(dx*dx + dy*dy))
            }

            let rotation = 0
            {
                const dx = resizedPoints[1].x - resizedPoints[0].x
                const dy = resizedPoints[1].y - resizedPoints[0].y
                rotation = Math.atan2(dy, dx)
            }

            const x = resizedPoints.reduce((sum, p) => sum + p.x, 0) / resizedPoints.length
            const y = resizedPoints.reduce((sum, p) => sum + p.y, 0) / resizedPoints.length

            return { 
                width, 
                height,
                rotation,
                x,
                y
            }
        },
        onScan(result: {data: string, cornerPoints: Array<{x: number, y: number}>}) {
            const { data, cornerPoints } = result
            const dimensions = this.calculateDimensions(cornerPoints)

            clearTimeout(this.postponeTimeout)
            this.setPostponeTimer()

            if (!this.readyForNextScan) {
                return
            }

            if (data) {
                this.lastScans.push({ timestamp: Date.now(), data: "scanned data" })
            }
            
            // Check if last 4 scans happened within 3 seconds and are the same
            const recentScans = this.lastScans.filter(
                (scan) => Date.now() - scan.timestamp < 3000,
            )
            const allSame = recentScans.every(
                (scan) => scan.data === recentScans[0].data,
            )
            
            
            if (recentScans.length >= 2 && allSame) {
                this.readyForNextScan = false
                this.updateProgress(this.storyLineIndex + 1)
   
            }
        },
        endScan(success: boolean) {
            clearTimeout(this.postponeTimeout)

            if (this.qrScanner) {
                this.qrScanner.stop()
            }
            success = false
            
            const qrScannerEl = this.$el.querySelector("#qr-scanner") as HTMLVideoElement
            const scanRegionHighlightEl = this.$el.querySelector(".scan-region-highlight-svg") as SVGElement
            // Navigate to next page
            gsap.killTweensOf(".story-line-message")
            if (success) {
                this.updateTextMessage(this.successLines[Math.floor(Math.random() * this.successLines.length)])
            } else {
                this.processFailure()
            }

            gsap.to(".progressbar, .view-finder", {
                duration: 0.6,
                borderColor: "transparent",
            })
            gsap.to(".view-finder", {
                height: 0,
            })

            const bars = this.$el.querySelectorAll(".progressbar .bar")
            for (let i = 0; i < bars.length; i++) {
                const barEl = bars[i]
                gsap.to(barEl, {
                    duration: 1,
                    y: 128,
                    ease: "elastic.in(1, 0.8)",
                    rotate: Math.random() * 16 - 8,
                    delay: Math.random() * 0.4,
                })
                gsap.to(barEl, {
                    duration: 1,
                    opacity: 0,
                    delay: .5,
                })
            }

            gsap.to(".story-line-message", {
                duration: .8,
                margin: 0,
                delay: 1.6,
                ease: "power1.inOut",
            })

            gsap.to(".progressbar", {
                duration: .8,
                height: 0,
                margin: 0,
                delay: 1.6,
                ease: "power1.inOut",
            })
        },
        processFailure() {
            gsap.to(".story-line-message", {
                duration: .8,
                opacity: 0,
                ease: "power1.inOut",
                onComplete: () => {
                    setTimeout(() => {
                        this.updateTextMessage(this.failureLines[Math.floor(Math.random() * this.failureLines.length)])
                    }, 800)

                    gsap.to(".scan-page-view-finder-actions", {
                        duration: 1,
                        height: 64,
                        delay: 2,
                        onComplete: () => {
                        },
                    })
                },
            })
        },
        updateProgress(value: number) {
            const bars = this.$el.querySelectorAll(".progressbar .bar")
            const maxBars = bars.length
            const startPoint = this.progress
            this.progress = Math.round(value / this.storyLine.length * maxBars )  
            this.updateTextMessage(this.storyLine[this.storyLineIndex])
            
            const animateBars = bars
            let delay = 0
            for (let i = startPoint; i < this.progress; i++) {
                const barEl = bars[i]
                const animation = {
                    duration: 0.8,
                    opacity: 1,
                    delay: delay,
                }

                if (i === this.progress - 1) {
                    animation['onComplete'] = () => {
                        this.storyLineIndex++
                        this.readyForNextScan = true
                        if (this.storyLineIndex >= this.storyLine.length) {
                            // Parse data for Identity code
                            this.readyForNextScan = false
                            this.endScan(Math.random() < 0.5)
                        }
                    }
                }
                gsap.to(barEl, animation)
                delay += 0.05
            }
        },
        setPostponeTimer() {
            clearTimeout(this.postponeTimeout)
            this.postponeTimeout = setTimeout(() => {

                // Safety check
                if (this.storyLineIndex >= this.storyLine.length) {
                    return
                }

                this.updateTextMessage(this.postponeLines[this.postponeIndex])
                this.postponeIndex = (this.postponeIndex + 1) % this.postponeLines.length
                clearTimeout(this.postponeTimeout)
                this.setPostponeTimer()
            }, 8000)
        },
        updateTextMessage(text: string) {
            gsap.to(".story-line-message", {
                duration: 0.32,
                opacity: 0,
                onComplete: () => {
                    this.message.text = text
                    gsap.to(".story-line-message", {
                        duration: 0.6,
                        opacity: 1,
                    })
                },
            })
        },
    },
})
</script>

<style>
.qr-scanner-container {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
}

.scan-page #qr-scanner {
    /* pointer-events: none; */
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
}

.scan-page .loader {
    position: fixed;
    left: 50%;
    translate: -50% -50%;
    top: 50%;
    width: 128px;
    z-index: 1;
    pointer-events: none;
}

.scan-region-highlight-svg {
    /* display: none; */
}

/* .story-line-messages {
    position: fixed;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    text-align: center;
    z-index: 10;
    scale: -1 1;
    height: 100%;
    width: 100%;
    max-height: 100vh;
    max-width: 100vh;
    aspect-ratio: 1;
}

.story-line-message {
    position: absolute;
    color: var(--bg-color);
    background-color: var(--contrast-color);
    padding: 8px 32px 10px;   
    font-size: 18px;
    line-height: 1.2;
    font-family: var(--accent-font);
    translate: -50% -50%;
    scale: -1 1 !important;
    opacity: 0;
    width: auto !important;
    translate: 0 8px;
} */
.scan-region-highlight {
    opacity: 0 !important;
}

.progressbar {
    /* position: absolute; */
    /* bottom: 50%;
    left: 50%;
    translate: -50%; */
    display: flex;
    gap: 1px;
    z-index: 10;
    /* border: 1px solid currentColor; */
    width: 80%;
    margin-left: 10%;
    color: var(--accent-color);
    padding: 4px;
    margin-top: 24px;
}

.progressbar .bar {
    width: calc(100% / 48 - 1px);
    height: 24px;
    background-color: currentColor; 
    opacity: .2;
}

.story-line-message {
    /* position: fixed; */
    /* bottom: 48px; */
    /* left: 50%; */
    /* translate: -50% 0; */
    margin-bottom: 32px;
    display: inline-block;
    color: var(--accent-color);
    text-align: center;
    width: 100%;
    font-size: clamp(16px, 4vw, 24px);
    line-height: 1;
    font-family: var(--accent-font);
    z-index: 2;
}

.scan-page-view-finder {
    position: fixed;
    z-index: 1;
    top: 50%;
    translate: -50% -50%;
    left: 50%;
    width: clamp(256px, calc(100% - 64px), 50vh);
    pointer-events: none;
    opacity: 0;
    color: var(--accent-color);
}

.scan-page-view-finder .view-finder {
    aspect-ratio: 1;
    width: 100%;
    border: 1px solid currentColor;
}

.scan-page-view-finder footer {
    margin-top: 24px;
    text-align: center;
    width: 100%;
}

.scan-page-view-finder .jao-icon {
    font-style: normal;
    font-size: 12px;
    display: flex;
    font-family: var(--accent-font);
    color: var(--contrast-color);
    flex-direction: column;
    gap: 8px;
    align-items: center;

    svg {
        width: 40px;
    }
}

.page-go-back {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 199;
    font-size: 16px;
    display: flex;
    flex-flow: row;
    gap: 8px;
    text-decoration: none;
    font-family: var(--accent-font);
    line-height: 1;
    align-items: center;
    color: var(--contrast-color);

    &:visited {
        color: var(--contrast-color)
    }

    &:active {
        color: var(--accent-color)
    }

    svg {
        width: 23px;
        .jao-icon-cell[v="1"] {
            fill: currentColor !important;
        }
    }
}

.scan-page-view-finder-actions {
    width: 100%;
    height: 0;
    overflow: hidden;
}

@media (min-width: 768px) {
    .progressbar {
        gap: 2px;
    }
    /* .progressbar .bar {
        width: 8px;
    } */
}
</style>
