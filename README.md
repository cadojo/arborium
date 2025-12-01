# arborium

Batteries-included [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar collection with HTML rendering and WASM support.

[![Crates.io](https://img.shields.io/crates/v/arborium.svg)](https://crates.io/crates/arborium)
[![Documentation](https://docs.rs/arborium/badge.svg)](https://docs.rs/arborium)
[![License](https://img.shields.io/crates/l/arborium.svg)](LICENSE-MIT)

## Features

- **26 language grammars** included out of the box
- **Permissive licensing by default** - only MIT/Apache-2.0/CC0 grammars enabled
- **WASM support** with custom allocator fix
- **Feature flags** for fine-grained control over included languages

## Usage

```toml
[dependencies]
arborium = "0.1"
```

By default, all permissively-licensed grammars are included. To select specific languages:

```toml
[dependencies]
arborium = { version = "0.1", default-features = false, features = ["lang-rust", "lang-javascript"] }
```

## Feature Flags

### Grammar Collections

| Feature | Description |
|---------|-------------|
| `mit-grammars` | All permissively licensed grammars (MIT, Apache-2.0, CC0) - **default** |
| `gpl-grammars` | GPL-licensed grammars (copyleft - may affect your project's license) |
| `all-grammars` | All grammars including GPL |

### Individual Languages

#### From crates.io (MIT licensed)

| Feature | Language | Source |
|---------|----------|--------|
| `lang-asm` | Assembly | [tree-sitter-asm](https://github.com/RubixDev/tree-sitter-asm) |
| `lang-bash` | Bash | [tree-sitter-bash](https://github.com/tree-sitter/tree-sitter-bash) |
| `lang-c` | C | [tree-sitter-c](https://github.com/tree-sitter/tree-sitter-c) |
| `lang-cpp` | C++ | [tree-sitter-cpp](https://github.com/tree-sitter/tree-sitter-cpp) |
| `lang-css` | CSS | [tree-sitter-css](https://github.com/tree-sitter/tree-sitter-css) |
| `lang-go` | Go | [tree-sitter-go](https://github.com/tree-sitter/tree-sitter-go) |
| `lang-html` | HTML | [tree-sitter-html](https://github.com/tree-sitter/tree-sitter-html) |
| `lang-java` | Java | [tree-sitter-java](https://github.com/tree-sitter/tree-sitter-java) |
| `lang-javascript` | JavaScript | [tree-sitter-javascript](https://github.com/tree-sitter/tree-sitter-javascript) |
| `lang-markdown` | Markdown | [tree-sitter-md](https://github.com/tree-sitter-grammars/tree-sitter-markdown) |
| `lang-python` | Python | [tree-sitter-python](https://github.com/tree-sitter/tree-sitter-python) |
| `lang-rust` | Rust | [tree-sitter-rust](https://github.com/tree-sitter/tree-sitter-rust) |
| `lang-typescript` | TypeScript | [tree-sitter-typescript](https://github.com/tree-sitter/tree-sitter-typescript) |
| `lang-yaml` | YAML | [tree-sitter-yaml](https://github.com/tree-sitter-grammars/tree-sitter-yaml) |

#### Vendored Grammars (Permissive)

| Feature | Language | License | Source |
|---------|----------|---------|--------|
| `lang-clojure` | Clojure | CC0-1.0 | [tree-sitter-clojure](https://github.com/sogaiu/tree-sitter-clojure) |
| `lang-diff` | Diff | MIT | [tree-sitter-diff](https://github.com/the-mikedavis/tree-sitter-diff) |
| `lang-dockerfile` | Dockerfile | MIT | [tree-sitter-dockerfile](https://github.com/camdencheek/tree-sitter-dockerfile) |
| `lang-ini` | INI | Apache-2.0 | [tree-sitter-ini](https://github.com/justinmk/tree-sitter-ini) |
| `lang-meson` | Meson | MIT | [tree-sitter-meson](https://github.com/tree-sitter-grammars/tree-sitter-meson) |
| `lang-nix` | Nix | MIT | [tree-sitter-nix](https://github.com/nix-community/tree-sitter-nix) |
| `lang-scss` | SCSS | MIT | [tree-sitter-scss](https://github.com/serenadeai/tree-sitter-scss) |
| `lang-toml` | TOML | MIT | [tree-sitter-toml](https://github.com/tree-sitter-grammars/tree-sitter-toml) |
| `lang-zig` | Zig | MIT | [tree-sitter-zig](https://github.com/tree-sitter-grammars/tree-sitter-zig) |

#### GPL-Licensed Grammars (Opt-in)

These grammars are **not included by default** due to their copyleft license.
Enabling them may have implications for your project's licensing.

| Feature | Language | License | Source |
|---------|----------|---------|--------|
| `lang-jinja2` | Jinja2 | GPL-3.0 | [tree-sitter-jinja2](https://github.com/dbt-labs/tree-sitter-jinja2) |

## Sponsors

CI infrastructure generously provided by [Depot](https://depot.dev).

[![Depot](https://depot.dev/badges/depot.svg)](https://depot.dev)

## License

This project is dual-licensed under [MIT](LICENSE-MIT) OR [Apache-2.0](LICENSE-APACHE).

The bundled grammar sources retain their original licenses - see [LICENSES.md](LICENSES.md) for details.

## WASM Support

Arborium supports building for `wasm32-unknown-unknown`. This requires compiling C code (tree-sitter core and grammar parsers) to WebAssembly.

### macOS

On macOS, the built-in Apple clang does **not** support the `wasm32-unknown-unknown` target. You need to install LLVM via Homebrew:

```bash
brew install llvm
```

Then ensure the Homebrew LLVM is in your PATH when building:

```bash
export PATH="$(brew --prefix llvm)/bin:$PATH"
cargo build --target wasm32-unknown-unknown
```

## FAQ

### Build fails with "No available targets are compatible with triple wasm32-unknown-unknown"

**Error message:**
```
error: unable to create target: 'No available targets are compatible with triple "wasm32-unknown-unknown"'
```

**Cause:** You're using Apple's built-in clang, which doesn't include the WebAssembly backend.

**Solution:** Install LLVM via Homebrew and use it instead:

```bash
brew install llvm
export PATH="$(brew --prefix llvm)/bin:$PATH"
cargo build --target wasm32-unknown-unknown
```

You may want to add the PATH export to your shell profile (`.zshrc`, `.bashrc`, etc.) or use a tool like [direnv](https://direnv.net/) to set it per-project.

## Development

### Regenerating Grammars

```bash
cargo xtask regenerate
```

This will:
1. Run `tree-sitter init --update` for grammars with existing config
2. Run `npm install` for grammars with npm dependencies
3. Run `tree-sitter generate` in dependency order (e.g., CSS before SCSS)
4. Clean up generated files we don't need (bindings, etc.)
