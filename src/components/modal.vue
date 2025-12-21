<template>
    <div class="modal-overlay" :class="[isVisible ? '__isVisible' : '__isHidden']" ref="modalOverlay" @click="closeModal">
        <div class="modal-content" @click.stop ref="modalContent">
            <div class="modal-header">
                <div class="modal-title">
                    <!-- TITLE SLOT -->
                    <slot name="title"></slot>
                </div>
                <jao-icon name="cross" class="modal-close" size="medium" inactiveColor="var(--bg-color)" @click="closeModal" />
            </div>
            <!-- DEFAULT SLOT -->
            <slot></slot>
            <div v-if="!hideSubmit" class="modal-actions">
                <button class="modal-submit" type="submit" ref="modalSubmit" @click="handleSubmit">
                    <!-- SUBMIT TEXT SLOT -->
                    <slot name="submit-text">Submit</slot>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import gsap from "gsap"
import { defineComponent } from "vue"
import jaoIcon from "@/components/jao-icon.vue"

export default defineComponent({
    name: "modalComponent",
    props: {
        isOpen: {
            type: Boolean,
            required: false,
            default: false
        },
        autoClose: {
            type: Boolean,
            required: false,
            default: true
        },
        hideSubmit: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    components: {
        jaoIcon
    },
    data() {
        return {
            isVisible: false
        }
    },
    watch: {
        isOpen: {
            handler(val) {
                this.isVisible = val
                if (val) {
                    this.openModal()
                } else {
                    this.closeModal()
                }
            },
            immediate: true
        }
    },
    mounted() {
        document.addEventListener('keydown', this.handleEscape)
        const formEl = this.$el.querySelector("form")
        
        if (formEl?.id) {
            const submitButton = this.$refs.modalSubmit as HTMLButtonElement
            submitButton.setAttribute("form", formEl.id)
        }
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this.handleEscape)
    },
    methods: {
        openModal() {
            const modalOverlay = this.$refs.modalOverlay as HTMLElement
            const modalContent = this.$refs.modalContent as HTMLElement
            this.isVisible = true

            gsap.killTweensOf(modalOverlay)
            gsap.killTweensOf(modalContent)
            this.$nextTick(() => {
                
                if (!modalOverlay || !modalContent) {
                    return
                }
                gsap.fromTo([modalOverlay, modalContent], {
                    opacity: 0
                },{
                    opacity: 1,
                    duration: 0.8,
                    ease: "power3.out"
                })
                gsap.fromTo(modalContent, {
                    y: 32,
                },{
                    y: 0,
                    duration: 0.64,
                    ease: "power3.out"
                })
            })
        },
        closeModal() {
            const modalOverlay = this.$refs.modalOverlay as HTMLElement
            const modalContent = this.$refs.modalContent as HTMLElement
            if (!modalOverlay || !modalContent) {
                return
            }
            
            modalOverlay.style.pointerEvents = "none"
            this.$emit('close-immediate')
            gsap.to(modalOverlay, {
                opacity: 0,
                duration: 1.28,
                ease: "power3.out",
                onComplete: () => {
                    this.isVisible = false
                    this.$emit('close')
                    modalOverlay.style.pointerEvents = "auto"
                }
            })
            gsap.to(modalContent, {
                y: 32,
                duration: 0.64,
                opacity: 0,
                ease: "power3.out"
            })
        },
        handleSubmit() {
            this.$emit('submit')
            if (this.autoClose) {
                this.closeModal()
            }
        },
        handleEscape(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                this.closeModal()
            }
        }
    }
})
</script>

<style>

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;

    &.__isHidden {
        pointer-events: none;
        opacity: 0;
    }

    &.__isVisible {
        pointer-events: auto;
    }
}

.modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    height: 36px;
    aspect-ratio: 1;
}

.modal-content {
    background-color: var(--bg-color);
    padding: 24px;
    width: clamp(240px, calc(100% - 64px - 64px), 640px);
    max-height: 90vh;
    position: relative;
    font-family: var(--default-font);

    p {
        margin: 40px 0;
        line-height: 1.3;
    }
}

.modal-actions {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
}

.modal-title {
    h1, h2, h3, h4, h5, h6 {
        margin: -3px 0 -24px;
        width: calc(100% - 40px);
    }
}

.modal-header {
    display: block;
    width: 100%;
}

.modal-header + * {
    margin-top: 40px;
}

.modal-submit {
    background-color: var(--contrast-color);
    color: var(--bg-color);
    border: 0 none transparent;
    padding: 8px 16px;
    font-family: var(--accent-font);
    font-size: 16px;
    cursor: pointer;
    transition: var(--transition-default);

    &:hover,
    &:focus {
        opacity: 0.9;
        scale: 1.1;
    }
}
</style> 