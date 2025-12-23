<template>
    <Modal class="invalid-parent-id-modal" :is-open="isOpen" :auto-close="false" :hide-submit="true" @close-immediate="closeModalImmediate" @close="closeModal" @submit="submit()">
        <template #title v-if="parent">
            <h2>You already know {{ parent.name }}! </h2>
        </template>
        <section>
            <figure>
                <wurmpjeThumbnail class="parent-wurmpje" :identityField="parent" />
            </figure>
            <figcaption class="parent-identity" v-if="parentIdentity">
                <span class="parent-name">
                    {{ parentIdentity.name }}
                </span>
                <span class="parent-age">
                    {{ age }}
                </span>
            </figcaption>
        </section>

    </Modal>
</template>


<script lang="ts">
import { defineComponent, type PropType } from "vue"
import Modal from "@/components/modal.vue";
import jaoIcon from "@/components/jao-icon.vue";
import type { IdentityField } from "@/models/identity";
import wurmpjeThumbnail from "@/components/wurmpje-thumbnail.vue";
import useIdentityStore, { type DBIdentity } from "@/stores/identity";


export default defineComponent ({ 
    name: "invalidParentIdModal",
    components: { 
        Modal,
        jaoIcon,
        wurmpjeThumbnail
    },
    props: {
        isOpen: {
            type: Boolean,
            required: false
        },
        parent: {
            type: Object as PropType<IdentityField>,
            required: true
        }
    },
    setup() {
        const identityStore = useIdentityStore()
        
        return {
            identityStore: identityStore
        }
    },
    computed: {
        age() {
            if (!this.parentIdentity || !this.parentIdentity.created) {
                return "";
            }

            const age = this.identityStore.calculateAgeInDays(this.parentIdentity.created);
            if (age <= 1) {
                return "1 day old";
            } else {
                return `(${age} days old)`;
            }
        }
    },
    watch: {
        parent: {
            handler() {
                this.loadIdentity()
            },
            immediate: true
        }
    },
    data() {
        return {
            parentIdentity: null as DBIdentity | null
        }
    },
    methods: {
        closeModalImmediate() {
            this.$emit("closeImmediate")
        },
        closeModal() {
            this.$emit("close")
        },
        openModal() {
            // This timeout is needed to force a reset of the modal component
        },
        submit() {
            this.$emit("submit")
        },

        async loadIdentity() {
            if (!this.parent) {
                return;
            }
            
            this.parentIdentity = await this.identityStore.findIdentityInDatabase("id", this.parent.id);
            return this.parentIdentity;
        }
    }
})

</script>

<style>
.invalid-parent-id-modal {
    .modal-content {
        max-width: 50vh;
    }

    p {
        margin-bottom: 16px;
    }

    .parent-wurmpje {
        width: 100%;
        margin: 0;
    }

    .parent-identity {
        display: flex;
        flex-flow: column;
        align-items: center;
        font-family: var(--accent-font);
        font-size: 16px;
    }
    .parent-age {
        font-size: 14px;
        opacity: 0.64;
    } 
}
</style>