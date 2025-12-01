fn main() {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let manifest_path = std::path::Path::new(&manifest_dir);

    // wasm-sysroot is at workspace root (two levels up from crates/arborium-sysroot)
    let wasm_sysroot = manifest_path
        .parent()
        .and_then(|p| p.parent())
        .map(|p| p.join("wasm-sysroot"))
        .expect("Failed to find workspace root");

    // Emit metadata that dependent crates can access via DEP_ARBORIUM_SYSROOT_PATH
    println!("cargo::metadata=PATH={}", wasm_sysroot.display());
}
