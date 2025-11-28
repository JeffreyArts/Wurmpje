import Matter from "matter-js"
export type clickEventFunction = (mousePos: { x: number, y: number }) => void
export type resizeEventFunction = () => void


export class MatterSetup {
    engine: Matter.Engine
    world: Matter.World
    renderer: Matter.Render
    runner: Matter.Runner
    el: HTMLElement
    devMode: boolean = false
    clickEvents: Array<{ fn: clickEventFunction, name: string }> = []
    resizeEvents: Array<{ fn: resizeEventFunction, name: string }> = []

    constructor(target: HTMLElement, options?: {
        devMode: boolean
    }) {
        this.engine = Matter.Engine.create()
        this.world = this.engine.world
        this.el = target
        
        this.renderer = Matter.Render.create({
            element: target,
            engine: this.engine,
            options: {
                width: target.clientWidth,
                height: target.clientHeight,
                wireframes: false,
                showCollisions: true,
            }
        })

        this.devMode = options?.devMode || false
        
        if (this.devMode) {
            Matter.Render.run(this.renderer)
        }
        
        // create runner
        this.runner = Matter.Runner.create()
        
        // run the engine
        Matter.Runner.run(this.runner, this.engine)
        
        // Manually handle initial resize
        setTimeout(() => { 
            // Fire resize event
            document.dispatchEvent(new Event("resize"))
        })
        
        new Proxy(this, {
            get(target, prop, receiver) {
                if (prop === "devMode") {
                    if (target["devMode"] == true) {
                        Matter.Render.run(target.renderer)
                    } else {
                        Matter.Render.stop(target.renderer)
                    }

                    return target.devMode
                }
                return Reflect.get(target, prop, receiver)
            }
        })

        window.addEventListener("click", this.#onClick.bind(this))
        window.addEventListener("touchstart", this.#onTap.bind(this))
        window.addEventListener("resize", this.#onResize.bind(this))
    }

    #onResize() {
        this.resizeEvents.forEach(resizeEvent => {
            resizeEvent.fn()
        })
    }

    #onClick(event: MouseEvent) {
        const rect = (this.el as HTMLElement).getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        this.clickEvents.forEach(clickEvent => {
            clickEvent.fn({ x, y })
        })
    }

    #onTap(event: TouchEvent) {
        const rect = (this.el as HTMLElement).getBoundingClientRect()
        const x = event.touches[0].clientX - rect.left
        const y = event.touches[0].clientY - rect.top

        this.clickEvents.forEach(clickEvent => {
            clickEvent.fn({ x, y })
        })
    }

    addResizeEvent(fn: resizeEventFunction, name: string) {
        this.resizeEvents.push({ fn, name })
    }

    removeResizeEvent(name: string) {
        this.resizeEvents = this.resizeEvents.filter(fn => {
            return fn.name !== name
        })
    }

    addClickEvent(fn: clickEventFunction, name: string) {
        this.clickEvents.push({ fn, name })
    }

    removeClickEvent(name: string) {
        this.clickEvents = this.clickEvents.filter(fn => {
            return fn.name !== name
        })
    }

}