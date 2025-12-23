<template>
    <Modal class="invalid-parent-id-modal" :is-open="isOpen" :auto-close="false" :hide-submit="true" @close-immediate="closeModalImmediate" @close="closeModal" @submit="submit()">
        <template #title>
            <h2><jao-icon name="skull" size="large" active-color="currentColor" inactive-color="transparent"></jao-icon>Invalid parent id</h2>
        </template>
        <p>
            The provided parent identity is invalid. Try again using a different parent id.
        </p>

    </Modal>
</template>


<script lang="ts">
import { defineComponent, type PropType } from "vue"
import Modal from "@/components/modal.vue";
import jaoIcon from "@/components/jao-icon.vue";

export default defineComponent ({ 
    name: "invalidParentIdModal",
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
    },
    data() {
        return {
            showModal: false,
            
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
        },
        submit() {
            this.$emit("submit")
        }
    }
})

</script>

<style>
.invalid-parent-id-modal {
    .modal-content {
        max-width: 360px;
    }

    p {
        margin-bottom: 16px;
    }
}
</style>