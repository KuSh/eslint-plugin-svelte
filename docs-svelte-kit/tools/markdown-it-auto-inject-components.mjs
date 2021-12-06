/**
 * @param {import('markdown-it')} md
 */
export default (md) => {
  md.core.ruler.push("auto_inject_components", (state) => {
    const injected = new Set(extractInjectedComponents(state.tokens))
    for (const component of new Set(
      extractComponents(state.tokens, injected),
    )) {
      const newToken = new state.Token("auto_inject_component")
      newToken.content = `<script>
import ${component} from '$lib/components/${component}.svelte'
</script>`
      state.tokens.unshift(newToken)
    }

    /** Extract imported components */
    function* extractInjectedComponents(tokens) {
      for (const token of tokens) {
        if (
          (token.type === "html_inline" || token.type === "html_block") &&
          token.content.trim().startsWith("<script")
        ) {
          const match = /import\s+([A-Z][\w$.]*)/u.exec(token.content)
          if (match) {
            yield match[1]
          }
        }
        if (token.children && token.children.length) {
          yield* extractInjectedComponents(token.children)
        }
      }
    }

    /** Extract inject components */
    function* extractComponents(tokens, injected) {
      for (const token of tokens) {
        if (token.type === "html_inline" || token.type === "html_block") {
          const match = /<([A-Z][\w$]*)/u.exec(token.content)
          if (match && !injected.has(match[1])) {
            yield match[1]
          }
        }
        if (token.children && token.children.length) {
          yield* extractComponents(token.children, injected)
        }
      }
    }
  })
  // eslint-disable-next-line camelcase -- ignore
  md.renderer.rules.auto_inject_component = (tokens, idx, _options) => {
    return tokens[idx].content
  }
}