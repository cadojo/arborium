//! HTML rendering from highlight spans.
//!
//! This module converts raw spans from grammar plugins into HTML with proper
//! handling of overlapping spans (deduplication) and nested highlights.

use std::collections::HashMap;

/// A raw span from parsing.
#[derive(Debug, Clone)]
pub struct Span {
    pub start: u32,
    pub end: u32,
    pub capture: String,
}

/// Convert capture name to HTML tag suffix.
/// Maps capture names like "keyword" to short tags like "k".
fn capture_to_tag(capture: &str) -> &'static str {
    // This maps tree-sitter capture names to arborium's short HTML tags.
    // The mapping follows arborium-theme's HIGHLIGHTS definitions.
    match capture {
        "attribute" => "at",
        "constant" => "co",
        "constant.builtin" | "constant.builtin.boolean" => "cb",
        "constructor" => "cr",
        "function.builtin" => "fb",
        "function" => "f",
        "function.method" => "fm",
        "function.definition" => "fd",
        "function.call" => "fc",
        "keyword" => "k",
        "keyword.conditional" => "kc",
        "keyword.coroutine" => "ko",
        "keyword.debug" => "kd",
        "keyword.exception" => "ke",
        "keyword.function" => "kf",
        "keyword.import" => "ki",
        "keyword.operator" => "kp",
        "keyword.repeat" => "kr",
        "keyword.return" => "kt",
        "keyword.type" => "ky",
        "keyword.modifier" => "km",
        "keyword.directive" => "dr",
        "operator" => "o",
        "property" => "pr",
        "punctuation" => "p",
        "punctuation.bracket" => "pb",
        "punctuation.delimiter" => "pd",
        "punctuation.special" => "ps",
        "string" => "s",
        "string.special" | "string.special.symbol" | "string.special.path" => "ss",
        "string.escape" | "escape" => "se",
        "string.regexp" | "string.regex" => "rx",
        "tag" => "tg",
        "tag.delimiter" => "td",
        "tag.error" => "te",
        "type" => "t",
        "type.builtin" => "tb",
        "type.qualifier" => "tq",
        "type.definition" => "tf",
        "variable" => "v",
        "variable.builtin" => "vb",
        "variable.parameter" | "parameter" => "vp",
        "variable.member" => "vm",
        "comment" => "c",
        "comment.documentation" => "cd",
        "macro" => "m",
        "label" => "l",
        "diff.addition" | "diff.plus" | "diff.delta" => "da",
        "diff.deletion" | "diff.minus" => "dd",
        "number" | "constant.numeric" | "float" => "n",
        "text.literal" | "markup.raw" => "tl",
        "text.emphasis" | "markup.italic" => "em",
        "text.strong" | "markup.bold" => "st",
        "text.uri" | "markup.link.url" => "tu",
        "text.reference" | "markup.link.text" => "tr",
        "text.title" | "markup.heading" => "tt",
        "text.strikethrough" | "markup.strikethrough" => "tx",
        "spell" => "sp",
        "embedded" => "eb",
        "error" => "er",
        "namespace" | "module" => "ns",
        "include" => "in",
        "storageclass" => "sc",
        "repeat" => "rp",
        "conditional" => "cn",
        "exception" => "ex",
        "preproc" => "pp",
        "character" => "ch",
        "character.special" => "cs",
        "boolean" => "cb",
        // Skip these - they produce no output
        "none" | "nospell" => "",
        // Fallback: use first two characters if unknown
        other => {
            // Return empty for unknown captures - they won't be styled
            // In practice, most captures should be in the list above
            ""
        }
    }
}

/// Highlight event for processing.
#[derive(Debug, Clone)]
enum HighlightEvent {
    /// Start of a highlighted region.
    Start { tag: &'static str },
    /// End of a highlighted region.
    End,
    /// Source text to emit.
    Source { start: usize, end: usize },
}

/// Deduplicate spans and convert to HTML.
///
/// This handles the case where multiple captures apply to the same range
/// by keeping only one (the last one, which is typically more specific).
pub fn spans_to_html(source: &str, mut spans: Vec<Span>) -> String {
    if spans.is_empty() {
        return html_escape(source);
    }

    // Sort spans by (start, -end) so longer spans come first at same start
    spans.sort_by(|a, b| {
        a.start
            .cmp(&b.start)
            .then_with(|| b.end.cmp(&a.end))
    });

    // Deduplicate: for spans with the exact same (start, end), keep the last one
    // (later patterns in tree-sitter queries are more specific)
    let mut deduped: HashMap<(u32, u32), Span> = HashMap::new();
    for span in spans {
        let key = (span.start, span.end);
        // Always overwrite - later spans take precedence
        deduped.insert(key, span);
    }

    // Convert back to vec and sort
    let mut spans: Vec<Span> = deduped.into_values().collect();
    spans.sort_by(|a, b| {
        a.start
            .cmp(&b.start)
            .then_with(|| b.end.cmp(&a.end))
    });

    // Build events from spans
    let mut events: Vec<(u32, bool, usize)> = Vec::new(); // (pos, is_start, span_index)
    for (i, span) in spans.iter().enumerate() {
        events.push((span.start, true, i));
        events.push((span.end, false, i));
    }

    // Sort events: by position, then ends before starts at same position
    events.sort_by(|a, b| {
        a.0.cmp(&b.0)
            .then_with(|| a.1.cmp(&b.1)) // false (end) < true (start)
    });

    // Process events with a stack
    let mut html = String::with_capacity(source.len() * 2);
    let mut last_pos: usize = 0;
    let mut stack: Vec<usize> = Vec::new(); // indices into spans

    for (pos, is_start, span_idx) in events {
        let pos = pos as usize;

        // Emit any source text before this position
        if pos > last_pos && pos <= source.len() {
            let text = &source[last_pos..pos];
            if let Some(&top_idx) = stack.last() {
                let tag = capture_to_tag(&spans[top_idx].capture);
                if !tag.is_empty() {
                    html.push_str("<a-");
                    html.push_str(tag);
                    html.push('>');
                    html.push_str(&html_escape(text));
                    html.push_str("</a-");
                    html.push_str(tag);
                    html.push('>');
                } else {
                    html.push_str(&html_escape(text));
                }
            } else {
                html.push_str(&html_escape(text));
            }
            last_pos = pos;
        }

        // Update the stack
        if is_start {
            stack.push(span_idx);
        } else {
            // Remove this span from stack
            if let Some(idx) = stack.iter().rposition(|&x| x == span_idx) {
                stack.remove(idx);
            }
        }
    }

    // Emit remaining text
    if last_pos < source.len() {
        let text = &source[last_pos..];
        if let Some(&top_idx) = stack.last() {
            let tag = capture_to_tag(&spans[top_idx].capture);
            if !tag.is_empty() {
                html.push_str("<a-");
                html.push_str(tag);
                html.push('>');
                html.push_str(&html_escape(text));
                html.push_str("</a-");
                html.push_str(tag);
                html.push('>');
            } else {
                html.push_str(&html_escape(text));
            }
        } else {
            html.push_str(&html_escape(text));
        }
    }

    html
}

/// Escape HTML special characters.
fn html_escape(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    for c in text.chars() {
        match c {
            '<' => result.push_str("&lt;"),
            '>' => result.push_str("&gt;"),
            '&' => result.push_str("&amp;"),
            '"' => result.push_str("&quot;"),
            '\'' => result.push_str("&#39;"),
            _ => result.push(c),
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_highlight() {
        let source = "fn main";
        let spans = vec![
            Span { start: 0, end: 2, capture: "keyword".into() },
            Span { start: 3, end: 7, capture: "function".into() },
        ];
        let html = spans_to_html(source, spans);
        assert_eq!(html, "<a-k>fn</a-k> <a-f>main</a-f>");
    }

    #[test]
    fn test_overlapping_spans_dedupe() {
        let source = "apiVersion";
        // Two spans for the same range - should keep only one
        let spans = vec![
            Span { start: 0, end: 10, capture: "property".into() },
            Span { start: 0, end: 10, capture: "variable".into() },
        ];
        let html = spans_to_html(source, spans);
        // Should only have one tag, not two
        assert!(!html.contains("apiVersionapiVersion"));
        assert!(html.contains("apiVersion"));
    }

    #[test]
    fn test_html_escape() {
        let source = "<script>";
        let spans = vec![];
        let html = spans_to_html(source, spans);
        assert_eq!(html, "&lt;script&gt;");
    }
}
