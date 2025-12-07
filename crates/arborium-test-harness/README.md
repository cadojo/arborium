# arborium-test-harness

[![crates.io](https://img.shields.io/crates/v/arborium-test-harness.svg)](https://crates.io/crates/arborium-test-harness)
[![docs.rs](https://img.shields.io/docsrs/arborium-test-harness)](https://docs.rs/arborium-test-harness)
[![license](https://img.shields.io/crates/l/arborium-test-harness.svg)](https://github.com/bearcove/arborium)

Test harness for [arborium](https://github.com/bearcove/arborium) grammar crates.

This crate provides utilities for testing tree-sitter grammars and their highlight queries.

## Usage

In your grammar crate's test module:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_grammar() {
        arborium_test_harness::test_grammar(
            language(),
            "rust",
            HIGHLIGHTS_QUERY,
            INJECTIONS_QUERY,
            LOCALS_QUERY,
            env!("CARGO_MANIFEST_DIR"),
        );
    }
}
```

## What it tests

The `test_grammar` function:

1. **Validates queries** - Ensures highlights.scm, injections.scm, and locals.scm compile without errors
2. **Finds samples** - Looks for sample files defined in `arborium.kdl`
3. **Tests highlighting** - Highlights each sample and verifies at least one highlight is produced

## Sample files

Sample files are defined in your crate's `arborium.kdl`:

```kdl
sample {
    path "samples/example.rs"
}
```

## Highlight names

The harness configures tree-sitter with the standard arborium highlight names:

- `attribute`, `boolean`, `comment`, `comment.documentation`
- `constant`, `constant.builtin`, `constructor`, `constructor.builtin`
- `escape`, `function`, `function.builtin`, `keyword`
- `markup`, `markup.bold`, `markup.heading`, `markup.italic`, `markup.link`, etc.
- `module`, `number`, `operator`, `property`, `property.builtin`
- `punctuation`, `punctuation.bracket`, `punctuation.delimiter`, `punctuation.special`
- `string`, `string.escape`, `string.regexp`, `string.special`
- `tag`, `type`, `type.builtin`
- `variable`, `variable.builtin`, `variable.member`, `variable.parameter`

## License

MIT
