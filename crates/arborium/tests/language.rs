//! Tree Sitter Language construction tests.
//!
//! Tests that verify grammar construction works as expected.

#![cfg(feature = "lang-rust")]

use arborium;

#[test]
fn get_rust() {
    assert!(arborium::get_language("rust").is_some());
}

#[test]
fn get_unsupported() {
    // a fictional (and therefore unsupported) language named "bartholomew"
    assert!(arborium::get_language("bartholomew").is_none());
}
