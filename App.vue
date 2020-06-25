<template>
    <div>
        <markdown :markdown="require('!raw-loader!./example.md').default"/>
    </div>
</template>

<script>
import Markdown from './Markdown'

export default {
    components: { Markdown }
}
</script>