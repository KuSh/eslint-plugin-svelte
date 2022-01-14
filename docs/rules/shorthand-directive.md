---
pageClass: "rule-details"
sidebarDepth: 0
title: "@ota-meshi/svelte/shorthand-directive"
description: "enforce use of shorthand syntax in directives"
---

# @ota-meshi/svelte/shorthand-directive

> enforce use of shorthand syntax in directives

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> **_This rule has not been released yet._** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule enforces the use of the shorthand syntax in directives.

<ESLintCodeBlock fix>

<!-- prettier-ignore-start -->
<!--eslint-skip-->

```svelte
<script>
  /* eslint @ota-meshi/svelte/shorthand-directive: "error" */
  let value = 'hello!'
  let active = true
  let color = 'red'
</script>

<!-- ✓ GOOD -->
<input bind:value>
<div class:active>...</div>
<div style:color>...</div>

<!-- ✗ BAD -->
<input bind:value={value}>
<div class:active={active}>...</div>
<div style:color={color}>...</div>
```

<!-- prettier-ignore-end -->

</ESLintCodeBlock>

## :wrench: Options

```json
{
  "@ota-meshi/svelte/shorthand-directive": [
    "error",
    {
      "prefer": "always" // "never"
    }
  ]
}
```

- `prefer`
  - `"always"` ... Expects that the shorthand will be used whenever possible. This is default.
  - `"never"` ... Ensures that no shorthand is used in any directive.

## :couple: Related Rules

- [@ota-meshi/svelte/shorthand-attribute]

[@ota-meshi/svelte/shorthand-attribute]: ./shorthand-directive.md

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-svelte/blob/main/src/rules/shorthand-directive.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-svelte/blob/main/tests/src/rules/shorthand-directive.ts)