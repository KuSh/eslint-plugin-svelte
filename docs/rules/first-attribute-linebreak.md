---
pageClass: "rule-details"
sidebarDepth: 0
title: "@ota-meshi/svelte/first-attribute-linebreak"
description: "enforce the location of first attribute"
---

# @ota-meshi/svelte/first-attribute-linebreak

> enforce the location of first attribute

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> **_This rule has not been released yet._** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule aims to enforce a consistent location for the first attribute.

<eslint-code-block fix>

<!-- prettier-ignore-start -->
<!--eslint-skip-->

```svelte
<script>
  /* eslint @ota-meshi/svelte/first-attribute-linebreak: "error" */
</script>

<!-- ✓ GOOD -->
<input type="checkbox" />
<button
  type="button"
  on:click={click} />
<button type="button" on:click={click} />

<!-- ✗ BAD -->
<input
  type="checkbox" />
<button type="button"
  on:click={click} />
<button
  type="button" on:click={click} />
```

<!-- prettier-ignore-end -->

</eslint-code-block>

## :wrench: Options

```json
{
  "@ota-meshi/svelte/first-attribute-linebreak": [
    "error",
    {
      "multiline": "below", // or "beside"
      "singleline": "beside" // "below"
    }
  ]
}
```

- `multiline` ... The location of the first attribute when the attributes span multiple lines. Default is `"below"`.
  - `"below"` ... Requires a newline before the first attribute.
  - `"beside"` ... Disallows a newline before the first attribute.
- `singleline` ... The location of the first attribute when the attributes on single line. Default is `"beside"`.
  - `"below"` ... Requires a newline before the first attribute.
  - `"beside"` ... Disallows a newline before the first attribute.

## :couple: Related Rules

- [@ota-meshi/svelte/max-attributes-per-line]

[@ota-meshi/svelte/max-attributes-per-line]: ./max-attributes-per-line.md

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-svelte/blob/main/src/rules/first-attribute-linebreak.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-svelte/blob/main/tests/src/rules/first-attribute-linebreak.ts)