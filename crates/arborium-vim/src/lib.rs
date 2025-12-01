//! VIM grammar for tree-sitter
//!
//! This crate provides the vim language grammar for use with tree-sitter.

use tree_sitter_patched_arborium::Language;

unsafe extern "C" {
    fn tree_sitter_vim() -> Language;
}

/// Returns the vim tree-sitter language.
pub fn language() -> Language {
    unsafe { tree_sitter_vim() }
}

/// The highlight query for vim (empty - no highlights available).
pub const HIGHLIGHTS_QUERY: &str = "";

/// The injections query for vim (empty - no injections available).
pub const INJECTIONS_QUERY: &str = "";

/// The locals query for vim (empty - no locals available).
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
