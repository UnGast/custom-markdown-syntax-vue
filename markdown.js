import MarkdownIt from 'markdown-it'

const md = MarkdownIt()

console.log('MARKDOWN', md)

md.block.ruler.before('paragraph', 'slider', (state, startLine, lineMax, silent) => {
    // first check whether the block starts with 'slider', if so,
    // we continue to parse the following lines as a list of images
    const content = state.getLines(startLine, startLine + 1, 0, false)
    if (content !== 'slider') {
        return false
    }

    // go to next line because we don't want the slider keyword
    // to be parsed again and added as an image
    state.line++

    // the second parameter could be a html tag,
    // but it's not necessary because we render to Vue components anyways
    // this information is mainly used by the default markdown-it renderer
    // the 3rd parameter specifices the nesting level of the specified a tag
    // 1 would mean opening, 0 self-closing, -1 closing
    // for us this doesn't make a difference, we can set it to 0
    state.push('slider_open', '', 1)

    // go through the following lines until we find an empty line
    // or all lines are consumed
    for (;
        state.line < state.lineMax && !state.isEmpty(state.line);
        state.line++) {
            const lineContent =
                state.getLines(
                    state.line, state.line + 1, 0, false)
            // creating an inline token and passing
            // content to it will execute the inline
            // rules on the content and fill
            // `inlineToken.children` with the matching tokens
            const token = state.push('inline', '', 0)
            // the content we pass here will be parsed
            // with inline rules,
            token.content = lineContent
            // we need to manually create this property
            // the image tokens will be found here
            // note: we are not filtering by the token
            // type here, a text token could just
            // as well appear in this list as an image
            // we will filter them in the AST generator
            token.children = []
    }

    state.push('slider_close', '', 0)

    // mark the lines as consumed
    return true
})

md.inline.ruler.before('link', 'katex', (state, silent) => {
    // get the content from the current position up to the end
    const followingContent = state.src.substring(state.pos)
    // match [katex:some_katex_content]
    const matches = /^\[katex\:(.*?)\]/.exec(followingContent)
    
    if (matches === null) {
        return false
    }

    const token = state.push('katex', '', 0)
    token.content = matches[1]

    // the next rule will be executed after
    // the closing bracket
    state.pos += matches[0].length

    return true
})

function tokensToAst(tokens) {
    const ast = []
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]
        var childTokens

        switch (token.type) {
            case 'paragraph_open':
                // get a list of all tokens
                // following the paragraph_open token
                childTokens = tokens.slice(i + 1)

                // only keep the tokens until the first
                // paragraph_close token shows up
                childTokens = childTokens.slice(
                    0,
                    childTokens.findIndex(
                        token => token.type === 'paragraph_close'))
                
                ast.push({
                    type: 'paragraph',
                    children: tokensToAst(childTokens)
                })

                // the childTokens have been processed
                // in a recursive call of the tokenToAst function
                // already. In the current (outer) function call we don't
                // need to process them again. So jump over them
                // as well as over the paragraph_close token.
                i += childTokens.length + 1
                break
            case 'inline':
                // an inline token is simply a container for a list
                // of more "detailed" token types such as "text" or "link",
                // we can add those directly to the ast without
                // the need for a wrapper node
                ast.push(...tokensToAst(token.children))
                break
            case 'text':
                ast.push({
                    type: 'text',
                    content: token.content
                })
                break
            case 'link_open':
                // same procedure as with paragraph_open
                childTokens = tokens.slice(i + 1)
                childTokens = childTokens.slice(
                    0,
                    childTokens.findIndex(
                        token => token.type === 'link_close'))
                ast.push({
                    type: 'link',
                    children: tokensToAst(childTokens),
                    // retrieve the link url
                    href: token.attrGet('href')
                })
                i += childTokens.length + 1
                break
            case 'slider_open':
                // same procedure as with paragraph_open
                childTokens = tokens.slice(i + 1)
                childTokens = childTokens.slice(
                    0,
                    childTokens.findIndex(token => token.type === 'slider_close'))
        
                // convert tokens to ast nodes
                // and only keep images, discard the rest
                var imageAstNodes = tokensToAst(childTokens)
                    .filter(token => token.type === 'image')
        
                ast.push({
                    type: 'slider',
                    images: imageAstNodes
                })
                i += childTokens.length + 1
                break
            case 'image':
                ast.push({
                    type: 'image',
                    alt: token.content,
                    url: token.attrGet('src')
                })
                break
            case 'katex':
                ast.push({
                    type: 'katex',
                    content: token.content
                })
            default:
                //console.debug('Unsupported token', token)
        }
    }
    return ast
}

export function markdownToAst(markdown) {
    const tokens = md.parse(markdown)
    console.log('tokens', tokens)

    const ast = tokensToAst(tokens)
    console.log('ast', ast)

    return ast
}