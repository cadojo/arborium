# miette-arborium

[![crates.io](https://img.shields.io/crates/v/miette-arborium.svg)](https://crates.io/crates/miette-arborium)
[![docs.rs](https://img.shields.io/docsrs/miette-arborium)](https://docs.rs/miette-arborium)
[![license](https://img.shields.io/crates/l/miette-arborium.svg)](https://github.com/bearcove/arborium)

Tree-sitter powered syntax highlighting for [miette](https://crates.io/crates/miette) diagnostics.

![Screenshot showing syntax-highlighted Rust code in a miette error message](https://raw.githubusercontent.com/bearcove/arborium/main/assets/miette-arborium-screenshot.png)

## Features

- **Accurate highlighting** — Uses tree-sitter parsers, not regex, for language-aware syntax highlighting
- **90+ languages** — All languages supported by arborium, with more added regularly
- **Automatic language detection** — Detects language from file extension or explicit hint
- **Theme support** — Ships with Monokai (default), plus all arborium themes (Dracula, Catppuccin, etc.)
- **Lean builds** — Enable only the languages you need via feature flags

## Quick Start

Add to your `Cargo.toml`:

```toml
[dependencies]
miette = { version = "7", features = ["fancy"] }
miette-arborium = { version = "0.3", features = ["lang-rust"] }
```

Then wire it up:

```rust
use miette::GraphicalReportHandler;
use miette_arborium::ArboriumHighlighter;

let handler = GraphicalReportHandler::new()
    .with_syntax_highlighting(ArboriumHighlighter::new());
```

That's it! Your miette diagnostics now have syntax highlighting.

## Theme Support

The default theme is Monokai. To use a different theme:

```rust
use miette_arborium::ArboriumHighlighter;
use arborium::theme::builtin;

// Use Dracula theme
let highlighter = ArboriumHighlighter::with_theme(builtin::dracula());

// Or Catppuccin Mocha
let highlighter = ArboriumHighlighter::with_theme(builtin::mocha());
```

Available themes: `monokai`, `dracula`, `mocha`, `macchiato`, `frappe`, `latte`, `github_dark`, `github_light`, `tokyo_night`, `gruvbox_dark`, `gruvbox_light`, `nord`, `one_dark`.

## Language Detection

miette-arborium detects languages in order of priority:

1. **Explicit hint** — via `NamedSource::new(...).with_language("rust")`
2. **File extension** — `.rs` → Rust, `.py` → Python, etc.

```rust
use miette::NamedSource;

// Explicit language hint (highest priority)
let src = NamedSource::new("example.txt", code).with_language("rust");

// Or just use the right extension (auto-detected)
let src = NamedSource::new("example.rs", code);
```

## Feature Flags

By default, no languages are enabled. Add the languages you need:

```toml
[dependencies]
miette-arborium = { version = "0.3", features = ["lang-rust", "lang-toml", "lang-json"] }
```

Or enable all languages (larger binary):

```toml
[dependencies]
miette-arborium = { version = "0.3", features = ["all-languages"] }
```

### Available Languages

<details>
<summary>Click to expand full list (90+ languages)</summary>

| Feature | Language |
|---------|----------|
| `lang-ada` | Ada |
| `lang-agda` | Agda |
| `lang-asm` | Assembly |
| `lang-awk` | AWK |
| `lang-bash` | Bash |
| `lang-batch` | Batch |
| `lang-c` | C |
| `lang-c-sharp` | C# |
| `lang-caddy` | Caddyfile |
| `lang-capnp` | Cap'n Proto |
| `lang-clojure` | Clojure |
| `lang-cmake` | CMake |
| `lang-commonlisp` | Common Lisp |
| `lang-cpp` | C++ |
| `lang-css` | CSS |
| `lang-d` | D |
| `lang-dart` | Dart |
| `lang-devicetree` | Devicetree |
| `lang-diff` | Diff |
| `lang-dockerfile` | Dockerfile |
| `lang-dot` | Graphviz DOT |
| `lang-elisp` | Emacs Lisp |
| `lang-elixir` | Elixir |
| `lang-elm` | Elm |
| `lang-erlang` | Erlang |
| `lang-fish` | Fish |
| `lang-fsharp` | F# |
| `lang-gleam` | Gleam |
| `lang-glsl` | GLSL |
| `lang-go` | Go |
| `lang-graphql` | GraphQL |
| `lang-haskell` | Haskell |
| `lang-hcl` | HCL/Terraform |
| `lang-hlsl` | HLSL |
| `lang-html` | HTML |
| `lang-idris` | Idris |
| `lang-ini` | INI |
| `lang-java` | Java |
| `lang-javascript` | JavaScript |
| `lang-jinja2` | Jinja2 |
| `lang-jq` | jq |
| `lang-json` | JSON |
| `lang-julia` | Julia |
| `lang-kdl` | KDL |
| `lang-kotlin` | Kotlin |
| `lang-lean` | Lean |
| `lang-lua` | Lua |
| `lang-matlab` | MATLAB |
| `lang-meson` | Meson |
| `lang-nginx` | Nginx |
| `lang-ninja` | Ninja |
| `lang-nix` | Nix |
| `lang-objc` | Objective-C |
| `lang-ocaml` | OCaml |
| `lang-perl` | Perl |
| `lang-php` | PHP |
| `lang-powershell` | PowerShell |
| `lang-prolog` | Prolog |
| `lang-python` | Python |
| `lang-query` | Tree-sitter Query |
| `lang-r` | R |
| `lang-rescript` | ReScript |
| `lang-ron` | RON |
| `lang-ruby` | Ruby |
| `lang-rust` | Rust |
| `lang-scala` | Scala |
| `lang-scheme` | Scheme |
| `lang-scss` | SCSS |
| `lang-sparql` | SPARQL |
| `lang-sql` | SQL |
| `lang-ssh-config` | SSH Config |
| `lang-starlark` | Starlark |
| `lang-svelte` | Svelte |
| `lang-swift` | Swift |
| `lang-textproto` | Text Proto |
| `lang-thrift` | Thrift |
| `lang-tlaplus` | TLA+ |
| `lang-toml` | TOML |
| `lang-tsx` | TSX |
| `lang-typescript` | TypeScript |
| `lang-typst` | Typst |
| `lang-uiua` | Uiua |
| `lang-vb` | Visual Basic |
| `lang-verilog` | Verilog |
| `lang-vhdl` | VHDL |
| `lang-vim` | Vimscript |
| `lang-vue` | Vue |
| `lang-x86asm` | x86 Assembly |
| `lang-xml` | XML |
| `lang-yaml` | YAML |
| `lang-yuri` | Yuri |
| `lang-zig` | Zig |
| `lang-zsh` | Zsh |

</details>

## Example

Run the showcase example to see highlighting across multiple languages:

```bash
cargo run --example miette_showcase -p miette-arborium --features all-languages
```

## About

This crate is part of [**arborium**](https://github.com/bearcove/arborium), a collection of tree-sitter grammars for syntax highlighting, maintained by [Amos Wenger](https://fasterthanli.me).

## License

MIT

## Links

- [GitHub](https://github.com/bearcove/arborium)
- [arborium docs](https://docs.rs/arborium)
- [miette docs](https://docs.rs/miette)
