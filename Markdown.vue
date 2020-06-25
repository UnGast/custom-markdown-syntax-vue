<script>
import Slider from './Slider'
import { markdownToAst } from './markdown.js'
import katex from 'katex'
require('katex/dist/katex.min.css')

 export default {
    props: {
        markdown: {
            type: String
        }
    },
    methods: {
        astNodeToVueNode(createElement, astNode) {
            switch (astNode.type) {
                case 'paragraph':
                    return createElement(
                        'p',
                        astNode.children.map(
                            this.astNodeToVueNode.bind(this, createElement)))
                case 'text':
                    return astNode.content
                case 'link':
                    return createElement(
                        'a',
                        { domProps: { href: astNode.href } },
                        astNode.children.map(
                            this.astNodeToVueNode.bind(this, createElement)))
                case 'slider':
                    return createElement(
                        Slider,
                        { props: { images: astNode.images } }
                    )
                case 'katex':
                    return createElement('span', {
                        class: 'katex',
                        domProps: { innerHTML: katex.renderToString(astNode.content) } })
            }
        },
    },
    render(createElement) {
        const ast = markdownToAst(this.markdown)
        return createElement(
            'div',
            { class: 'markdown' },
            ast.map(this.astNodeToVueNode.bind(this, createElement)))
    }
}
</script>