<template>
    <div class="home">
        <!-- <favicon class="thumbnail-helper"/> -->
        <matter-box class="matter-box"/>
    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import matterBox from "@/components/matter-box.vue";
// import Favicon from "@/components/favicon.vue";

export default defineComponent ({ 
    name: "homePage",
    components: { 
        matterBox,
        // Favicon
    },
    props: [],
    setup() {
        const identityStore = useIdentityStore()
        identityStore.init()

        return {
            identity: identityStore
        }
    },
    data() {
        return {
        }
    },
    head: { 
        title: "Home",
        meta: [
            {
                name: "description",
                content: "Lorem ipsum dolor samet...",
            },
        ]
    },
    mounted() {
    },
    methods: {
        
    }
})

</script>

<style>
.matter-box {
    width: 100%;
    height: calc(100vh - 80px);
}

</style>