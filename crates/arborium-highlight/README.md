# arborium-highlight

Unified syntax highlighting for arborium - works with both statically-linked Rust grammars and dynamically-loaded WASM plugins.

## Overview

`arborium-highlight` is the core highlighting engine for the arborium ecosystem. It provides:

- **Grammar-agnostic highlighting**: Works with any source of parse results
- **Capture → theme slot mapping**: Uses `arborium-theme` to map capture names to theme slots
- **Span coalescing**: Adjacent spans with the same theme slot merge into one element
- **Language injection support**: Recursive highlighting for embedded languages
- **HTML rendering**: Outputs compact `<a-*>` custom elements
- **Sync and async APIs**: Same core logic, different wrappers for different contexts

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Grammar Providers                                │
├────────────────────────────────┬────────────────────────────────────────┤
│   Rust: StaticProvider         │  WASM: WasmPluginProvider              │
│                                │                                        │
│   - Statically linked          │  - Dynamically loaded via JS           │
│   - get() returns immediately  │  - get() may await plugin load         │
│   - Use SyncHighlighter        │  - Use AsyncHighlighter                │
└────────────────────────────────┴────────────────────────────────────────┘
                    │                              │
                    │   impl GrammarProvider       │
                    │                              │
                    ▼                              ▼
         ┌─────────────────────────────────────────────────┐
         │              Core async highlight()              │
         │                                                  │
         │  Written once, handles:                          │
         │  • Injection recursion                           │
         │  • Span offset adjustment                        │
         │  • Deduplication                                 │
         │  • Capture → slot mapping                        │
         │  • Span coalescing                               │
         │  • HTML/ANSI rendering                           │
         └─────────────────────────────────────────────────┘
                    │                              │
                    ▼                              ▼
         ┌──────────────────┐           ┌──────────────────┐
         │  SyncHighlighter │           │ AsyncHighlighter │
         │                  │           │                  │
         │  Polls once,     │           │  Actually awaits │
         │  panics if       │           │  provider calls  │
         │  provider yields │           │                  │
         └──────────────────┘           └──────────────────┘
```

## Quick Start

### Rust (synchronous, static grammars)

```rust
use arborium::Highlighter;

let mut highlighter = Highlighter::new();
let html = highlighter.highlight("rust", r#"
    fn main() {
        println!("Hello, world!");
    }
"#)?;

// Output: <a-k>fn</a-k> <a-f>main</a-f>() { ... }
```

### WASM (asynchronous, dynamic plugins)

```javascript
import { ArboriumHost } from 'arborium';

const host = await ArboriumHost.create();
const html = await host.highlight('html', '<style>h1 { color: red; }</style>');
```

### Custom provider

```rust
use arborium_highlight::{Highlighter, GrammarProvider, Grammar, ParseResult, Span};

struct MyProvider { /* ... */ }

impl GrammarProvider for MyProvider {
    type Grammar = MyGrammar;

    async fn get(&mut self, language: &str) -> Option<&mut Self::Grammar> {
        // Return grammar for language, loading if necessary
    }
}

struct MyGrammar { /* ... */ }

impl Grammar for MyGrammar {
    fn parse(&mut self, text: &str) -> ParseResult {
        // Parse and return spans + injections
    }
}

// Use with sync wrapper (provider must not yield)
let mut highlighter = SyncHighlighter::new(MyProvider::new());
let html = highlighter.highlight("rust", source)?;

// Or async wrapper
let mut highlighter = AsyncHighlighter::new(MyProvider::new());
let html = highlighter.highlight("rust", source).await?;
```

## Core Types

### Span

A highlighted region of text with a capture name.

```rust
/// A span of highlighted text.
///
/// Spans come from grammar parsers and contain the raw capture name
/// (e.g., "keyword.function", "include", "string.special.symbol").
/// The capture name is later mapped to a theme slot for rendering.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Span {
    /// Byte offset where the span starts (inclusive).
    pub start: u32,

    /// Byte offset where the span ends (exclusive).
    pub end: u32,

    /// The capture name from the grammar's highlight query.
    ///
    /// Examples: "keyword", "function.builtin", "include", "storageclass"
    /// All are mapped to theme slots via `arborium_theme::tag_for_capture()`.
    pub capture: String,
}
```

### Injection

A point where another language should be parsed.

```rust
/// An injection point for embedded languages.
///
/// Injections are detected by the grammar's injection query.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Injection {
    /// Byte offset where the injection starts (inclusive).
    pub start: u32,

    /// Byte offset where the injection ends (exclusive).
    pub end: u32,

    /// The language to inject (e.g., "javascript", "css").
    pub language: String,

    /// Whether to include the node's children in the injection range.
    pub include_children: bool,
}
```

### ParseResult

The output of parsing a document.

```rust
/// Result of parsing a document with a grammar.
#[derive(Debug, Clone, Default)]
pub struct ParseResult {
    /// Highlighted spans from this parse.
    pub spans: Vec<Span>,

    /// Injection points for other languages.
    pub injections: Vec<Injection>,
}
```

### HighlightError

```rust
/// Errors that can occur during highlighting.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HighlightError {
    /// The requested language is not supported.
    UnsupportedLanguage(String),

    /// An error occurred during parsing.
    ParseError(String),
}
```

## The Grammar Trait

What a grammar can do - parse text and return spans.

```rust
/// A grammar that can parse text and produce highlight spans.
///
/// This is implemented by:
/// - Tree-sitter based parsers (for Rust)
/// - WASM plugin wrappers (for browser)
/// - Mock implementations (for testing)
pub trait Grammar {
    /// Parse text and return spans + injection points.
    ///
    /// This is always synchronous - the async part is *getting* the grammar,
    /// not using it.
    fn parse(&mut self, text: &str) -> ParseResult;
}
```

## The GrammarProvider Trait

How grammars are obtained - this is where sync vs async differs.

```rust
/// Provides grammars for languages.
///
/// This trait abstracts over how grammars are obtained:
///
/// - **Static (Rust)**: Grammars are statically linked. `get()` returns
///   immediately without awaiting.
///
/// - **Dynamic (WASM)**: Grammars are loaded as WASM plugins. `get()` may
///   need to fetch and instantiate a plugin, which is async.
///
/// # Implementation Notes
///
/// For sync contexts (Rust CLI tools, servers), implement `get()` to return
/// immediately. The `SyncHighlighter` wrapper will panic if `get()` yields.
///
/// For async contexts (WASM/browser), `get()` can await plugin loading.
/// Use `AsyncHighlighter` wrapper.
pub trait GrammarProvider {
    /// The grammar type this provider returns.
    type Grammar: Grammar;

    /// Get a grammar for a language.
    ///
    /// Returns `None` if the language is not supported.
    ///
    /// # Sync vs Async
    ///
    /// This is an async method, but for sync providers (static Rust grammars),
    /// it should return `Ready` immediately without yielding. The caller
    /// (SyncHighlighter) will poll once and panic if it gets `Pending`.
    async fn get(&mut self, language: &str) -> Option<&mut Self::Grammar>;
}
```

## Highlighters

### Core Implementation (internal)

The core logic is written once as async:

```rust
/// Internal async implementation - handles all the hard work.
struct HighlighterCore<P: GrammarProvider> {
    provider: P,
    config: HighlightConfig,
}

impl<P: GrammarProvider> HighlighterCore<P> {
    /// The main highlight function - written once, used by both wrappers.
    async fn highlight(&mut self, language: &str, source: &str) -> Result<String, HighlightError> {
        // 1. Get the primary grammar
        let grammar = self.provider.get(language).await
            .ok_or_else(|| HighlightError::UnsupportedLanguage(language.into()))?;

        // 2. Parse and collect spans (including from injections)
        let spans = self.collect_spans(grammar, source, 0, self.config.max_injection_depth).await?;

        // 3. Render to HTML
        Ok(render::spans_to_html(source, spans))
    }

    /// Recursively collect spans, handling injections.
    async fn collect_spans(
        &mut self,
        grammar: &mut P::Grammar,
        source: &str,
        base_offset: u32,
        remaining_depth: u32,
    ) -> Result<Vec<Span>, HighlightError> {
        let result = grammar.parse(source);

        // Adjust offsets
        let mut all_spans: Vec<Span> = result.spans
            .into_iter()
            .map(|mut s| { s.start += base_offset; s.end += base_offset; s })
            .collect();

        // Process injections
        if remaining_depth > 0 {
            for injection in result.injections {
                let start = injection.start as usize;
                let end = injection.end as usize;

                if end <= source.len() && start < end {
                    // Try to get grammar for injected language
                    if let Some(inj_grammar) = self.provider.get(&injection.language).await {
                        let injected_text = &source[start..end];
                        if let Ok(inj_spans) = self.collect_spans(
                            inj_grammar,
                            injected_text,
                            base_offset + injection.start,
                            remaining_depth - 1,
                        ).await {
                            all_spans.extend(inj_spans);
                        }
                    }
                    // If grammar not available, skip this injection silently
                }
            }
        }

        Ok(all_spans)
    }
}
```

### SyncHighlighter (for Rust)

```rust
/// Synchronous highlighter for Rust contexts.
///
/// Uses a sync provider where `get()` returns immediately.
/// Panics if the provider ever yields (returns Pending).
///
/// # Example
///
/// ```rust
/// use arborium_highlight::{SyncHighlighter, StaticProvider};
///
/// let mut highlighter = SyncHighlighter::new(StaticProvider::new());
/// let html = highlighter.highlight("rust", "fn main() {}")?;
/// ```
pub struct SyncHighlighter<P: GrammarProvider> {
    core: HighlighterCore<P>,
}

impl<P: GrammarProvider> SyncHighlighter<P> {
    pub fn new(provider: P) -> Self {
        Self {
            core: HighlighterCore::new(provider),
        }
    }

    pub fn with_config(provider: P, config: HighlightConfig) -> Self {
        Self {
            core: HighlighterCore::with_config(provider, config),
        }
    }

    /// Highlight source code synchronously.
    ///
    /// # Panics
    ///
    /// Panics if the provider's `get()` method yields (returns Pending).
    /// This indicates a bug - sync providers should never yield.
    pub fn highlight(&mut self, language: &str, source: &str) -> Result<String, HighlightError> {
        let future = self.core.highlight(language, source);

        // Pin the future on the stack
        let mut future = std::pin::pin!(future);

        // Create a no-op waker (we're not actually async)
        let waker = noop_waker();
        let mut cx = std::task::Context::from_waker(&waker);

        // Poll once - sync providers complete immediately
        match future.as_mut().poll(&mut cx) {
            std::task::Poll::Ready(result) => result,
            std::task::Poll::Pending => {
                panic!("SyncHighlighter: provider yielded. Use AsyncHighlighter for async providers.")
            }
        }
    }
}

/// Create a no-op waker for sync polling.
fn noop_waker() -> std::task::Waker {
    use std::task::{RawWaker, RawWakerVTable, Waker};

    const VTABLE: RawWakerVTable = RawWakerVTable::new(
        |_| RAW_WAKER,           // clone
        |_| {},                   // wake
        |_| {},                   // wake_by_ref
        |_| {},                   // drop
    );
    const RAW_WAKER: RawWaker = RawWaker::new(std::ptr::null(), &VTABLE);

    unsafe { Waker::from_raw(RAW_WAKER) }
}
```

### AsyncHighlighter (for WASM)

```rust
/// Asynchronous highlighter for WASM/browser contexts.
///
/// Uses an async provider where `get()` may need to load plugins.
///
/// # Example
///
/// ```rust
/// use arborium_highlight::{AsyncHighlighter, WasmPluginProvider};
///
/// let mut highlighter = AsyncHighlighter::new(WasmPluginProvider::new());
/// let html = highlighter.highlight("rust", "fn main() {}").await?;
/// ```
pub struct AsyncHighlighter<P: GrammarProvider> {
    core: HighlighterCore<P>,
}

impl<P: GrammarProvider> AsyncHighlighter<P> {
    pub fn new(provider: P) -> Self {
        Self {
            core: HighlighterCore::new(provider),
        }
    }

    pub fn with_config(provider: P, config: HighlightConfig) -> Self {
        Self {
            core: HighlighterCore::with_config(provider, config),
        }
    }

    /// Highlight source code asynchronously.
    pub async fn highlight(&mut self, language: &str, source: &str) -> Result<String, HighlightError> {
        self.core.highlight(language, source).await
    }
}
```

## Configuration

```rust
/// Configuration for highlighting.
#[derive(Debug, Clone)]
pub struct HighlightConfig {
    /// Maximum depth for processing language injections.
    ///
    /// - `0`: No injections (just primary language)
    /// - `3`: Default, handles most cases
    /// - Higher: For deeply nested content
    pub max_injection_depth: u32,
}

impl Default for HighlightConfig {
    fn default() -> Self {
        Self { max_injection_depth: 3 }
    }
}
```

## Rendering

The rendering module converts spans to HTML. This is always synchronous.

```rust
/// Render spans to HTML with `<a-*>` tags.
///
/// Processing steps:
/// 1. Deduplicate spans with same (start, end) - keep last
/// 2. Normalize captures to theme slots via tag_for_capture()
/// 3. Coalesce adjacent spans with same tag
/// 4. Render with proper escaping
pub fn spans_to_html(source: &str, spans: Vec<Span>) -> String { ... }

/// Write spans as HTML to a writer.
pub fn write_spans_as_html<W: Write>(w: &mut W, source: &str, spans: Vec<Span>) -> io::Result<()> { ... }

/// Escape HTML special characters.
pub fn html_escape(text: &str) -> String { ... }
```

## Provider Implementations

### StaticProvider (Rust)

For statically linked grammars:

```rust
/// Provider for statically linked tree-sitter grammars.
///
/// Grammars are created on first use and cached.
/// `get()` never yields - always returns immediately.
pub struct StaticProvider {
    grammars: HashMap<&'static str, TreeSitterGrammar>,
}

impl GrammarProvider for StaticProvider {
    type Grammar = TreeSitterGrammar;

    async fn get(&mut self, language: &str) -> Option<&mut Self::Grammar> {
        // Normalize language name
        let language = normalize_language(language);

        // Get or create grammar (sync - no await)
        if !self.grammars.contains_key(language) {
            let grammar = create_grammar(language)?;
            self.grammars.insert(language, grammar);
        }

        self.grammars.get_mut(language)
    }
}

/// Tree-sitter based grammar.
pub struct TreeSitterGrammar {
    parser: tree_sitter::Parser,
    highlights_query: tree_sitter::Query,
    injections_query: Option<tree_sitter::Query>,
    query_cursor: tree_sitter::QueryCursor,
}

impl Grammar for TreeSitterGrammar {
    fn parse(&mut self, text: &str) -> ParseResult {
        // 1. Parse text into tree
        let tree = self.parser.parse(text, None)?;

        // 2. Run highlights query
        let matches = self.query_cursor.matches(
            &self.highlights_query,
            tree.root_node(),
            text.as_bytes(),
        );

        // 3. Collect spans
        let spans = matches
            .flat_map(|m| m.captures)
            .map(|cap| Span {
                start: cap.node.start_byte() as u32,
                end: cap.node.end_byte() as u32,
                capture: capture_name(cap.index),
            })
            .collect();

        // 4. Run injections query
        let injections = /* ... */;

        ParseResult { spans, injections }
    }
}
```

### WasmPluginProvider (browser)

For dynamically loaded WASM plugins:

```rust
/// Provider for WASM grammar plugins (browser context).
///
/// Plugins are loaded via JavaScript and cached.
/// `get()` may await plugin loading.
pub struct WasmPluginProvider {
    plugins: HashMap<String, WasmGrammar>,
    // JS interop for loading plugins...
}

impl GrammarProvider for WasmPluginProvider {
    type Grammar = WasmGrammar;

    async fn get(&mut self, language: &str) -> Option<&mut Self::Grammar> {
        if !self.plugins.contains_key(language) {
            // This may await - loading plugin from network
            let plugin = load_plugin_from_js(language).await?;
            self.plugins.insert(language.into(), plugin);
        }

        self.plugins.get_mut(language)
    }
}

/// WASM plugin wrapper.
pub struct WasmGrammar {
    plugin_handle: u32,  // Handle to JS-managed plugin
    session: u32,        // Plugin session
}

impl Grammar for WasmGrammar {
    fn parse(&mut self, text: &str) -> ParseResult {
        // Call into WASM plugin via JS
        let result = plugin_parse(self.plugin_handle, self.session, text);

        ParseResult {
            spans: result.spans.into_iter().map(convert_span).collect(),
            injections: result.injections.into_iter().map(convert_injection).collect(),
        }
    }
}
```

## Injection Flow

Example: highlighting HTML with CSS and JavaScript:

```
highlight("html", "<style>h1 { color: red; }</style><script>let x = 1;</script>")

1. provider.get("html") → TreeSitterGrammar for HTML
   └─ Returns immediately (sync) or awaits (async)

2. html_grammar.parse(source)
   └─ Returns:
      spans: [<style> tag, </style> tag, <script> tag, </script> tag]
      injections: [
        { 7..25, "css" },
        { 41..51, "javascript" }
      ]

3. For injection "css":
   ├─ provider.get("css") → TreeSitterGrammar for CSS
   ├─ css_grammar.parse("h1 { color: red; }")
   │  └─ Returns spans: [h1 selector, color property, red value]
   └─ Adjust offsets by +7, add to all_spans

4. For injection "javascript":
   ├─ provider.get("javascript") → TreeSitterGrammar for JS
   ├─ js_grammar.parse("let x = 1;")
   │  └─ Returns spans: [let keyword, x variable, 1 number]
   └─ Adjust offsets by +41, add to all_spans

5. Combine all spans from all languages

6. Deduplicate, normalize to slots, coalesce

7. Render to HTML:
   <a-tg>&lt;style&gt;</a-tg><a-tg>h1</a-tg> { <a-pr>color</a-pr>: <a-co>red</a-co>; }...
```

## Theme Integration

Captures are mapped to theme slots via `arborium_theme::tag_for_capture()`:

| Captures | Tag | Theme Slot |
|----------|-----|------------|
| `keyword`, `keyword.*`, `include`, `conditional`, `repeat`, `storageclass`, ... | `k` | Keyword |
| `function`, `function.*`, `method`, `method.*` | `f` | Function |
| `string`, `string.*`, `character`, `escape` | `s` | String |
| `comment`, `comment.*` | `c` | Comment |
| `type`, `type.*` | `t` | Type |
| ... | ... | ... |

See `arborium-theme` for the complete mapping.

## CSS Styling

```css
a-k  { color: var(--keyword); }
a-f  { color: var(--function); }
a-s  { color: var(--string); }
a-c  { color: var(--comment); font-style: italic; }
a-t  { color: var(--type); }
/* ... */
```

## Crate Structure

```
crates/
├── arborium-highlight/           # This crate
│   └── src/
│       ├── lib.rs               # Public API
│       ├── types.rs             # Span, Injection, ParseResult
│       ├── traits.rs            # Grammar, GrammarProvider
│       ├── core.rs              # HighlighterCore (async impl)
│       ├── sync.rs              # SyncHighlighter
│       ├── async.rs             # AsyncHighlighter
│       └── render.rs            # HTML rendering
│
├── arborium/                     # Main crate (Rust)
│   └── Uses SyncHighlighter + StaticProvider
│
└── arborium-host/                # WASM host
    └── Uses AsyncHighlighter + WasmPluginProvider
```

## Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    /// Mock provider for testing - sync, returns immediately
    struct MockProvider {
        grammars: HashMap<&'static str, MockGrammar>,
    }

    impl GrammarProvider for MockProvider {
        type Grammar = MockGrammar;

        async fn get(&mut self, language: &str) -> Option<&mut Self::Grammar> {
            self.grammars.get_mut(language)
        }
    }

    struct MockGrammar {
        result: ParseResult,
    }

    impl Grammar for MockGrammar {
        fn parse(&mut self, _text: &str) -> ParseResult {
            self.result.clone()
        }
    }

    #[test]
    fn test_basic_highlighting() {
        let mut provider = MockProvider {
            grammars: [(
                "test",
                MockGrammar {
                    result: ParseResult {
                        spans: vec![Span { start: 0, end: 2, capture: "keyword".into() }],
                        injections: vec![],
                    },
                },
            )].into(),
        };

        let mut highlighter = SyncHighlighter::new(provider);
        let html = highlighter.highlight("test", "fn").unwrap();
        assert_eq!(html, "<a-k>fn</a-k>");
    }

    #[test]
    fn test_injection() {
        let mut provider = MockProvider {
            grammars: [
                ("outer", MockGrammar {
                    result: ParseResult {
                        spans: vec![],
                        injections: vec![Injection {
                            start: 0, end: 5,
                            language: "inner".into(),
                            include_children: false,
                        }],
                    },
                }),
                ("inner", MockGrammar {
                    result: ParseResult {
                        spans: vec![Span { start: 0, end: 5, capture: "string".into() }],
                        injections: vec![],
                    },
                }),
            ].into(),
        };

        let mut highlighter = SyncHighlighter::new(provider);
        let html = highlighter.highlight("outer", "hello").unwrap();
        assert_eq!(html, "<a-s>hello</a-s>");
    }

    #[test]
    fn test_span_coalescing() {
        let spans = vec![
            Span { start: 0, end: 3, capture: "keyword".into() },
            Span { start: 3, end: 7, capture: "keyword.function".into() },
        ];
        let html = render::spans_to_html("keyword", spans);
        assert_eq!(html, "<a-k>keyword</a-k>");
    }
}
```
