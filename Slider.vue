<template>
    <div class="slider">
        <p>This could become a slider sometime:</p>
        <img style="margin-right:8px" :src="image.url" :alt="image.alt" v-for="image in images" :key="image.url"/>
    </div>
</template>

<script>
export default {
    props: {
        images: {
            type: Array,
            required: true
        }
    }
}
</script>