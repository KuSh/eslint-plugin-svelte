import type { AST } from "svelte-eslint-parser"
import type * as ESTree from "estree"
import type { ASTNode, RuleContext, RuleListener } from "../../types"
import * as SV from "./svelte"
import * as ES from "./es"
import { isNotWhitespace } from "./ast"
import { isCommentToken } from "eslint-utils"
import type { IndentOptions } from "./commons"

type IndentUserOptions = {
  indent?: number | "tab"
  switchCase?: number
  ignoredNodes?: string[]
}
type AnyToken = AST.Token | AST.Comment

/**
 * Normalize options.
 * @param type The type of indentation.
 * @param options Other options.
 * @param defaultOptions The default value of options.
 * @returns Normalized options.
 */
function parseOptions(
  options: IndentUserOptions,
  defaultOptions: Partial<IndentOptions>,
): IndentOptions {
  const ret: IndentOptions = {
    indentChar: " ",
    indentSize: 2,
    switchCase: 1,
    ignoredNodes: [],
    ...defaultOptions,
  }

  if (Number.isSafeInteger(options.indent)) {
    ret.indentSize = Number(options.indent)
  } else if (options.indent === "tab") {
    ret.indentChar = "\t"
    ret.indentSize = 1
  }

  if (options.switchCase != null && Number.isSafeInteger(options.switchCase)) {
    ret.switchCase = options.switchCase
  }

  if (options.ignoredNodes != null) {
    ret.ignoredNodes = options.ignoredNodes
  }

  return ret
}

/**
 * Creates AST event handlers for html-indent.
 *
 * @param context The rule context.
 * @param defaultOptions The default value of options.
 * @returns AST event handlers.
 */
export function defineVisitor(
  context: RuleContext,
  defaultOptions: Partial<IndentOptions>,
): RuleListener {
  if (!context.getFilename().endsWith(".svelte")) return {}

  const options = parseOptions(context.options[0] || {}, defaultOptions)
  const sourceCode = context.getSourceCode()
  const offsets = new Map<
    AnyToken,
    | {
        baseToken: AnyToken
        offset: number
        baseline: false
        expectedIndent?: number
      }
    | {
        baseToken?: undefined
        offset: number
        baseline: true
        expectedIndent?: number
      }
  >()
  const ignoreTokens = new Set<AnyToken>()

  /**
   * Set offset to the given tokens.
   */
  function setOffset(
    token: AnyToken | null | undefined | (AnyToken | null | undefined)[],
    offset: number,
    baseToken: AnyToken,
  ) {
    if (!token) {
      return
    }
    if (Array.isArray(token)) {
      for (const t of token) {
        setOffset(t, offset, baseToken)
      }
      return
    }
    if (token === baseToken) {
      return
    }
    offsets.set(token, {
      baseToken,
      offset,
      baseline: false,
    })
  }

  /**
   * Copy offset to the given tokens from srcToken.
   */
  function copyOffset(
    token: AnyToken | null | undefined | (AnyToken | null | undefined)[],
    srcToken: AnyToken,
  ): void {
    if (!token) {
      return
    }
    const offsetData = offsets.get(srcToken)
    if (!offsetData) {
      return
    }
    if (!offsetData.baseline) {
      setOffset(token, offsetData.offset, offsetData.baseToken)
    } else {
      setOffsetBaseLine(token, offsetData.offset)
    }
  }

  /**
   * Set baseline offset to the given token.
   */
  function setOffsetBaseLine(
    token: AnyToken | null | undefined | (AnyToken | null | undefined)[],
    offset: number,
  ) {
    if (!token) {
      return
    }
    if (Array.isArray(token)) {
      for (const t of token) {
        setOffsetBaseLine(t, offset)
      }
      return
    }
    offsets.set(token, {
      offset,
      baseline: true,
      expectedIndent: undefined,
    })
  }

  /**
   * Ignore all tokens of the given node.
   */
  function ignore(node: ASTNode) {
    for (const token of sourceCode.getTokens(node)) {
      ignoreTokens.add(token)
    }
  }

  /**
   * Get the text of the indentation part of the given location.
   */
  function getIndentText({ line, column }: { line: number; column: number }) {
    return sourceCode.lines[line - 1].slice(0, column)
  }

  /**
   * Calculate correct indentation of the given token.
   */
  function getExpectedIndentFromToken(token: AnyToken): number | null {
    const offsetInfo = offsets.get(token)
    if (offsetInfo == null) {
      return null
    }
    if (offsetInfo.expectedIndent != null) {
      return offsetInfo.expectedIndent
    }
    if (offsetInfo.baseline) {
      return offsetInfo.offset * options.indentSize
    }
    const baseIndent = getExpectedIndentFromToken(offsetInfo.baseToken)
    if (baseIndent == null) {
      return null
    }
    return baseIndent + offsetInfo.offset * options.indentSize
  }

  /**
   * Calculate correct indentation of the line of the given tokens.
   */
  function getExpectedIndentFromTokens(tokens: AnyToken[]) {
    for (const token of tokens) {
      if (ignoreTokens.has(token)) {
        return null
      }
      const expectedIndent = getExpectedIndentFromToken(token)
      if (expectedIndent != null) {
        return expectedIndent
      }
    }
    return null
  }

  /** Save expected indent to give tokens */
  function saveExpectedIndent(tokens: AnyToken[], expectedIndent: number) {
    for (const token of tokens) {
      const offsetInfo = offsets.get(token)
      if (offsetInfo == null) {
        continue
      }
      offsetInfo.expectedIndent ??= expectedIndent
    }
  }

  /**
   * Validate the given token with the pre-calculated expected indentation.
   */
  function validateToken(token: AnyToken, expectedIndent: number) {
    const line = token.loc.start.line
    const indentText = getIndentText(token.loc.start)

    // `indentText` contains non-whitespace characters.
    if (indentText.trim() !== "") {
      return
    }

    const actualIndent = token.loc.start.column

    const mismatchCharIndexes: number[] = []
    for (let i = 0; i < indentText.length; ++i) {
      if (indentText[i] !== options.indentChar) {
        mismatchCharIndexes.push(i)
      }
    }
    if (actualIndent !== expectedIndent) {
      const loc = {
        start: { line, column: 0 },
        end: { line, column: actualIndent },
      }
      context.report({
        loc,
        messageId: "unexpectedIndentation",
        data: {
          expectedIndent: String(expectedIndent),
          actualIndent: String(actualIndent),
          expectedUnit: options.indentChar === "\t" ? "tab" : "space",
          actualUnit: mismatchCharIndexes.length
            ? "whitespace"
            : options.indentChar === "\t"
            ? "tab"
            : "space",
          expectedIndentPlural: expectedIndent === 1 ? "" : "s",
          actualIndentPlural: actualIndent === 1 ? "" : "s",
        },
        fix(fixer) {
          return fixer.replaceTextRange(
            [
              sourceCode.getIndexFromLoc(loc.start),
              sourceCode.getIndexFromLoc(loc.end),
            ],
            options.indentChar.repeat(expectedIndent),
          )
        },
      })
      return
    }

    for (const i of mismatchCharIndexes) {
      const loc = {
        start: { line, column: i },
        end: { line, column: i + 1 },
      }
      context.report({
        loc,
        messageId: "unexpectedChar",
        data: {
          expected: JSON.stringify(options.indentChar),
          actual: JSON.stringify(indentText[i]),
        },
        fix(fixer) {
          return fixer.replaceTextRange(
            [
              sourceCode.getIndexFromLoc(loc.start),
              sourceCode.getIndexFromLoc(loc.end),
            ],
            options.indentChar,
          )
        },
      })
    }
  }

  /** Process line tokens */
  function processLine(
    tokens: AnyToken[],
    prevComments: AST.Comment[],
    prevToken: AnyToken | null,
  ) {
    const firstToken = tokens[0]
    const actualIndent = firstToken.loc.start.column
    const expectedIndent = getExpectedIndentFromTokens(tokens)
    if (expectedIndent == null) {
      saveExpectedIndent(tokens, actualIndent)
      return
    }
    saveExpectedIndent(tokens, expectedIndent)

    let prev = prevToken
    if (prevComments.length) {
      if (prev && prev.loc.end.line < prevComments[0].loc.start.line) {
        validateToken(prevComments[0], expectedIndent)
      }
      prev = prevComments[prevComments.length - 1]
    }
    if (prev && prev.loc.end.line < tokens[0].loc.start.line) {
      validateToken(tokens[0], expectedIndent)
    }
  }

  const indentContext = {
    sourceCode,
    options,
    setOffset,
    copyOffset,
    setOffsetBaseLine,
    ignore,
  }
  const nodesVisitor = {
    ...ES.defineVisitor(indentContext),
    ...SV.defineVisitor(indentContext),
  }
  const knownNodes = new Set(Object.keys(nodesVisitor))

  /**
   * Build a visitor combined with a visitor to handle the given ignore selector.
   */
  function compositingIgnoresVisitor(visitor: RuleListener): RuleListener {
    for (const ignoreSelector of options.ignoredNodes) {
      const key = `${ignoreSelector}:exit`

      if (visitor[key]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
        const handler = visitor[key] as any
        visitor[key] = function (node: never, ...args: never[]) {
          const ret = handler.call(this, node, ...args)
          ignore(node)
          return ret
        }
      } else {
        visitor[key] = ignore
      }
    }

    return visitor
  }

  return compositingIgnoresVisitor({
    ...nodesVisitor,
    "*:exit"(node: ASTNode) {
      // Ignore tokens of unknown nodes.
      if (!knownNodes.has(node.type)) {
        ignore(node)
      }
    },
    "Program:exit"(node: ESTree.Program) {
      let prevToken: AnyToken | null = null
      for (const { prevComments, tokens } of iterateLineTokens()) {
        processLine(tokens, prevComments, prevToken)
        prevToken = tokens[tokens.length - 1]
      }

      /** Iterate line tokens */
      function* iterateLineTokens() {
        let line = 0
        let prevComments: AST.Comment[] = []
        let bufferTokens: AnyToken[] = []
        for (const token of sourceCode.getTokens(node, {
          includeComments: true,
          filter: isNotWhitespace,
        })) {
          const thisLine = token.loc.start.line
          if (line === thisLine || bufferTokens.length === 0) {
            bufferTokens.push(token)
          } else {
            if (
              isCommentToken(bufferTokens[0]) &&
              bufferTokens.every(isCommentToken)
            ) {
              prevComments.push(bufferTokens[0])
            } else {
              yield {
                prevComments,
                tokens: bufferTokens,
              }
              prevComments = []
            }
            bufferTokens = [token]
          }
          line = thisLine
        }
        if (bufferTokens.length && !bufferTokens.every(isCommentToken)) {
          yield {
            prevComments,
            tokens: bufferTokens,
          }
        }
      }
    },
  })
}