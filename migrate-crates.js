#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");
const { existsSync } = require("fs");

// Language to group mapping - customize this as needed
const LANGUAGE_GROUPS = {
  // Web languages (group-acorn)
  html: "group-acorn",
  css: "group-acorn",
  scss: "group-acorn",
  javascript: "group-acorn",
  typescript: "group-acorn",
  tsx: "group-acorn",
  json: "group-acorn",
  xml: "group-acorn",

  // Systems languages (group-birch)
  rust: "group-birch",
  c: "group-birch",
  cpp: "group-birch",
  go: "group-birch",
  zig: "group-birch",
  objc: "group-birch",
  asm: "group-birch",
  x86asm: "group-birch",

  // JVM languages (group-cedar)
  java: "group-cedar",
  kotlin: "group-cedar",
  scala: "group-cedar",
  clojure: "group-cedar",

  // Functional languages (group-fern)
  haskell: "group-fern",
  ocaml: "group-fern",
  elm: "group-fern",
  fsharp: "group-fern",
  erlang: "group-fern",
  elixir: "group-fern",
  gleam: "group-fern",
  scheme: "group-fern",
  commonlisp: "group-fern",
  idris: "group-fern",
  agda: "group-fern",
  lean: "group-fern",

  // Scripting languages (group-hazell)
  python: "group-hazell",
  ruby: "group-hazell",
  perl: "group-hazell",
  php: "group-hazell",
  lua: "group-hazell",
  bash: "group-hazell",
  fish: "group-hazell",
  zsh: "group-hazell",
  powershell: "group-hazell",

  // Data/Config languages (group-maple)
  yaml: "group-maple",
  toml: "group-maple",
  ini: "group-maple",
  kdl: "group-maple",
  ron: "group-maple",
  hcl: "group-maple",
  nginx: "group-maple",
  dockerfile: "group-maple",
  "ssh-config": "group-maple",

  // Academic/Research languages (group-moss)
  r: "group-moss",
  julia: "group-moss",
  matlab: "group-moss",
  prolog: "group-moss",
  sparql: "group-moss",
  tlaplus: "group-moss",

  // Modern languages (group-pine)
  swift: "group-pine",
  dart: "group-pine",
  rescript: "group-pine",
  starlark: "group-pine",
  uiua: "group-pine",
  yuri: "group-pine",

  // .NET languages (group-sage)
  "c-sharp": "group-sage",
  vb: "group-sage",
  fsharp: "group-sage", // can be in multiple groups

  // Web frameworks/templates (group-willow)
  svelte: "group-willow",
  vue: "group-willow",
  jinja2: "group-willow",
  markdown: "group-willow",
  "markdown-inline": "group-willow",
  asciidoc: "group-willow",
  asciidoc_inline: "group-willow",
  typst: "group-willow",

  // Specialized/Other languages - distribute across groups
  sql: "group-maple",
  graphql: "group-maple",
  query: "group-maple",
  jq: "group-maple",
  glsl: "group-moss",
  hlsl: "group-moss",
  verilog: "group-moss",
  vhdl: "group-moss",
  ada: "group-moss",
  devicetree: "group-pine",
  capnp: "group-pine",
  thrift: "group-pine",
  textproto: "group-pine",
  postscript: "group-sage",
  vim: "group-sage",
  elisp: "group-sage",
  awk: "group-hazell",
  batch: "group-hazell",
  caddy: "group-maple",
  cmake: "group-maple",
  meson: "group-maple",
  ninja: "group-maple",
  nix: "group-maple",
  dot: "group-maple",
  diff: "group-willow",
  d: "group-birch",
  minimal: "group-acorn",
};

// Files/directories that should be moved to def/ (committed/persistent)
const COMMITTED_ITEMS = ["arborium.kdl", "grammar", "queries", "samples"];

// Files/directories that should be moved to crate/ (generated)
const GENERATED_ITEMS = ["Cargo.toml", "build.rs", "src"];

// Additional files that might be sample files (pattern matching)
function isSampleFile(filename) {
  return /^sample\.[a-zA-Z0-9]+$/.test(filename);
}

function isCommittedItem(item, allItems) {
  return (
    COMMITTED_ITEMS.includes(item) ||
    isSampleFile(item) ||
    // Include any additional language-specific files that look like source
    /\.(scm|kdl|md|txt|yml|yaml)$/.test(item)
  );
}

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
}

async function copyItem(srcPath, destPath, dryRun = false) {
  const stats = await fs.stat(srcPath);

  if (dryRun) {
    console.log(`  COPY: ${srcPath} -> ${destPath}`);
    return;
  }

  if (stats.isDirectory()) {
    await ensureDir(destPath);
    const items = await fs.readdir(srcPath);

    for (const item of items) {
      const srcItemPath = path.join(srcPath, item);
      const destItemPath = path.join(destPath, item);
      await copyItem(srcItemPath, destItemPath, dryRun);
    }
  } else {
    await ensureDir(path.dirname(destPath));
    await fs.copyFile(srcPath, destPath);
  }
}

async function moveItem(srcPath, destPath, dryRun = false) {
  if (dryRun) {
    console.log(`  MOVE: ${srcPath} -> ${destPath}`);
    return;
  }

  await copyItem(srcPath, destPath, false);

  // Remove source after successful copy
  const stats = await fs.stat(srcPath);
  if (stats.isDirectory()) {
    await fs.rm(srcPath, { recursive: true });
  } else {
    await fs.unlink(srcPath);
  }
}

async function migrateCrate(crateName, dryRun = false, includeGenerated = false) {
  // Extract language name from crate name (remove 'arborium-' prefix)
  const langName = crateName.replace(/^arborium-/, "");

  // Skip non-language crates
  if (!LANGUAGE_GROUPS[langName]) {
    console.log(`⚠️  Skipping ${crateName} - no group mapping found for language '${langName}'`);
    return;
  }

  const groupName = LANGUAGE_GROUPS[langName];
  const cratePath = path.join("crates", crateName);
  const langPath = path.join("langs", groupName, langName);
  const defPath = path.join(langPath, "def");
  const crateDstPath = path.join(langPath, "crate");

  console.log(`\n📦 Migrating ${crateName} -> ${groupName}/${langName}`);

  // Check if source crate exists
  if (!existsSync(cratePath)) {
    console.log(`❌ Source crate not found: ${cratePath}`);
    return;
  }

  // Ensure destination directories exist
  if (!dryRun) {
    await ensureDir(defPath);
    if (includeGenerated) {
      await ensureDir(crateDstPath);
    }
  } else {
    console.log(`  CREATE DIR: ${defPath}`);
    if (includeGenerated) {
      console.log(`  CREATE DIR: ${crateDstPath}`);
    }
  }

  // Get all items in the crate directory
  const crateItems = await fs.readdir(cratePath);

  // Move committed items to def/
  for (const item of crateItems) {
    if (isCommittedItem(item, crateItems)) {
      const srcPath = path.join(cratePath, item);
      if (existsSync(srcPath)) {
        const destPath = path.join(defPath, item);
        await moveItem(srcPath, destPath, dryRun);
      }
    }
  }

  // Optionally move generated items to crate/
  if (includeGenerated) {
    for (const item of GENERATED_ITEMS) {
      const srcPath = path.join(cratePath, item);
      if (existsSync(srcPath)) {
        const destPath = path.join(crateDstPath, item);
        await moveItem(srcPath, destPath, dryRun);
      }
    }
  } else {
    // List generated items that would be left behind
    const generatedFound = GENERATED_ITEMS.filter((item) => existsSync(path.join(cratePath, item)));
    if (generatedFound.length > 0) {
      console.log(
        `  📋 Generated items left in source (will be regenerated): ${generatedFound.join(", ")}`,
      );
    }
  }

  // Check for any unexpected items
  const handledItems = crateItems.filter(
    (item) => isCommittedItem(item, crateItems) || GENERATED_ITEMS.includes(item),
  );
  const unexpectedItems = crateItems.filter(
    (item) => !isCommittedItem(item, crateItems) && !GENERATED_ITEMS.includes(item),
  );

  if (unexpectedItems.length > 0) {
    console.log(`  ⚠️  Unexpected items found: ${unexpectedItems.join(", ")}`);
  }

  console.log(`✅ Migration planned for ${crateName}`);
}

async function getAllArboriumCrates() {
  const cratesDir = "crates";
  const items = await fs.readdir(cratesDir);

  return items
    .filter((item) => {
      const fullPath = path.join(cratesDir, item);
      return (
        item.startsWith("arborium-") &&
        existsSync(fullPath) &&
        fs.stat(fullPath).then((stats) => stats.isDirectory())
      );
    })
    .filter(async (item) => {
      // Filter out non-language crates
      const stats = await fs.stat(path.join(cratesDir, item));
      return stats.isDirectory();
    });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const includeGenerated = args.includes("--include-generated");
  const specificCrates = args.filter((arg) => !arg.startsWith("--"));

  console.log("🚚 Arborium Crate Migration Tool");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "EXECUTE"}`);
  console.log(`Include generated files: ${includeGenerated ? "YES" : "NO"}`);

  if (specificCrates.length > 0) {
    console.log(`\n🎯 Migrating specific crates: ${specificCrates.join(", ")}`);

    for (const crateName of specificCrates) {
      await migrateCrate(crateName, dryRun, includeGenerated);
    }
  } else {
    console.log("\n🔍 Discovering arborium-* crates...");

    const crates = await getAllArboriumCrates();
    console.log(`Found ${crates.length} arborium crates`);

    for (const crateName of crates) {
      await migrateCrate(crateName, dryRun, includeGenerated);
    }
  }

  if (dryRun) {
    console.log("\n💡 This was a dry run. Add --execute to perform the migration.");
    console.log(
      "💡 Add --include-generated to also migrate Cargo.toml, build.rs, src/ to crate/ directories.",
    );
  } else {
    console.log("\n🎉 Migration completed!");
  }
}

// Usage examples in comments:
// node migrate-crates.js --dry-run                           # Preview all migrations
// node migrate-crates.js --dry-run arborium-rust             # Preview specific crate
// node migrate-crates.js --dry-run --include-generated       # Preview with generated files
// node migrate-crates.js arborium-rust arborium-python       # Migrate specific crates
// node migrate-crates.js --include-generated                 # Migrate all with generated files

if (require.main === module) {
  main().catch(console.error);
}
