//! HYPRLANG grammar for tree-sitter
//!
//! This crate provides the hyprlang language grammar for use with tree-sitter.

use tree_sitter_patched_arborium::Language;

unsafe extern "C" {
    fn tree_sitter_hyprlang() -> Language;
}

/// Returns the hyprlang tree-sitter language.
pub fn language() -> Language {
    unsafe { tree_sitter_hyprlang() }
}

/// The highlight query for hyprlang (empty - no highlights available).
pub const HIGHLIGHTS_QUERY: &str = "";

/// The injections query for hyprlang (empty - no injections available).
pub const INJECTIONS_QUERY: &str = "";

/// The locals query for hyprlang (empty - no locals available).
pub const LOCALS_QUERY: &str = "";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_language() {
        let lang = language();
        assert!(lang.version() > 0);
    }
}
