<template>
    <Modal class="request-invitation-modal" :is-open="showModal" :auto-close="false" @close="closeModal" @close-immediate="closeModalImmediate" @submit="submit">
        <template #title>
            <h2>Welcome</h2>
        </template>
        <p>
            Wurmpje is currently invite-only. 
            You can request an invitation by leaving your e-mailaddress below.
            You can also try to breed your own wurmpje via a qr-code.
        </p>

        <form @submit.prevent="submit" class="form" id="submit-email-form">
            <div class="row">
                <i class="icon">
                    <jao-icon name="mail" size="large" inactive-color="transparent" activeColor="var(--bg-color)" />
                </i>
                <input type="email" id="email" class="input large" @input="error=''" v-model="email" />
            </div>
            <div class="error-message" :class="[error ? '' : '__isHidden']" v-html="error"></div>
        </form>

        <template #submit-text>
            Request invitation
        </template>
    </Modal>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import Modal from "@/components/modal.vue";
import jaoIcon from "@/components/jao-icon.vue";

export default defineComponent ({ 
    name: "requestInvitationModal",
    components: { 
        Modal,
        jaoIcon
    },
    props: {
        isOpen: {
            type: Boolean,
            required: false
        }
    },
    watch: {
        isOpen: {
            handler(val) {
                if (val) {
                    this.openModal()
                } else {
                    this.closeModal()
                }
            },
            immediate: true
        }
    },
    data() {
        return {
            email: "",
            error: "",
            showModal: true,
            showContent: false
        }
    },
    head: { 
        title: "Home",
        meta: [
            {
                name: "description",
                content: "Welcome to the world of Wurmpje, your personal digital pet!",
            },
        ]
    },
    methods: {
        closeModalImmediate() {
            if (this.error) {
                return
            }
            this.$emit("close-immediate")
        },
        closeModal() {
            this.showModal = false
            this.$emit("close")
        },
        openModal() {
            // This timeout is needed to force a reset of the modal component
            this.showModal = false
            setTimeout(() => {
                this.showModal = true
            }, 0)
        },
        submit() {
            this.error = ""
            if (!this.email || this.email.indexOf("@") === -1) {
                this.error = "Please enter a valid e-mailaddress."
                return
            }
            fetch(`${import.meta.env.VITE_PAYLOAD_REST_ENDPOINT}/newsletter-subscriptions`, { 
                method: "POST",
                headers: { 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    email: this.email.toLowerCase(),
                    source: "Wurmpje"
                })
            }).then( response => {
                if (!response.ok) {
                    this.error = `Failed to subscribe cause of technical issues. Contact Jeffrey via <a href="mailto:contact@jeffreyarts.nl">contact@jeffreyarts.nl</a> if the issue persists.`
                } else {
                    this.closeModalImmediate()
                    this.email = ""
                    this.closeModal()
                }
            }).catch(error => {
                this.error = `Failed to subscribe cause of technical issues. Contact Jeffrey via <a href="mailto:contact@jeffreyarts.nl">contact@jeffreyarts.nl</a> if the issue persists.`
            })
        }
    }
})

</script>

<style>
.request-invitation-modal { 
    .modal-content {
        max-width: 400px;

        p {
            margin-bottom: 16px;
        }
    }

    .error-message {
        color: var(--error-color);
        min-height: 20px;
        margin-top: 8px;
        border: 1px solid currentColor;
        padding: 8px;
        font-size: 12px;
        background-color: color-mix(in srgb, var(--error-color) 8%, white); ;

        &.__isHidden {
            visibility: hidden;
        }

        a {
            color: currentColor;
            font-style: italic;
        }
    }
}

</style>