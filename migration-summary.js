#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");
const { existsSync } = require("fs");

// Language to group mapping - same as in migrate-crates.js
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

const GROUP_DESCRIPTIONS = {
  "group-acorn": "Web languages & minimal parsers",
  "group-birch": "Systems languages (C/C++/Rust/Go/Zig)",
  "group-cedar": "JVM languages (Java/Kotlin/Scala/Clojure)",
  "group-fern": "Functional languages (Haskell/ML/Lisp family)",
  "group-hazell": "Scripting languages (Python/Ruby/Shell)",
  "group-maple": "Data/Config formats (JSON/YAML/TOML/Build)",
  "group-moss": "Academic/Research languages (R/MATLAB/Hardware)",
  "group-pine": "Modern languages & protocols",
  "group-sage": ".NET languages & editors",
  "group-willow": "Web frameworks & document formats",
};

async function getAllArboriumCrates() {
  const cratesDir = "crates";
  const items = await fs.readdir(cratesDir);

  const langCrates = [];

  for (const item of items) {
    if (item.startsWith("arborium-")) {
      const fullPath = path.join(cratesDir, item);
      if (existsSync(fullPath)) {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
          langCrates.push(item);
        }
      }
    }
  }

  return langCrates;
}

async function main() {
  console.log("🗂️  Arborium Migration Summary");
  console.log("═".repeat(50));

  const crates = await getAllArboriumCrates();

  // Group languages by their target groups
  const groupedLanguages = {};
  const unmappedLanguages = [];

  for (const crateName of crates) {
    const langName = crateName.replace(/^arborium-/, "");
    const groupName = LANGUAGE_GROUPS[langName];

    if (groupName) {
      if (!groupedLanguages[groupName]) {
        groupedLanguages[groupName] = [];
      }
      groupedLanguages[groupName].push(langName);
    } else {
      unmappedLanguages.push(langName);
    }
  }

  // Display grouped languages
  const sortedGroups = Object.keys(groupedLanguages).sort();

  for (const groupName of sortedGroups) {
    const languages = groupedLanguages[groupName].sort();
    const description = GROUP_DESCRIPTIONS[groupName] || "No description";

    console.log(`\n🌳 ${groupName}`);
    console.log(`   ${description}`);
    console.log(`   Languages (${languages.length}): ${languages.join(", ")}`);
  }

  // Show unmapped languages
  if (unmappedLanguages.length > 0) {
    console.log(`\n⚠️  Unmapped Languages (${unmappedLanguages.length}):`);
    console.log(`   ${unmappedLanguages.sort().join(", ")}`);
    console.log("   These will be skipped during migration.");
  }

  // Summary stats
  console.log("\n📊 Migration Summary:");
  console.log(`   Total crates found: ${crates.length}`);
  console.log(`   Languages with groups: ${Object.values(groupedLanguages).flat().length}`);
  console.log(`   Unmapped languages: ${unmappedLanguages.length}`);
  console.log(`   Target groups: ${sortedGroups.length}`);

  // Group size breakdown
  console.log("\n📈 Group Sizes:");
  for (const [groupName, languages] of Object.entries(groupedLanguages)) {
    console.log(`   ${groupName}: ${languages.length} languages`);
  }

  console.log("\n💡 Next steps:");
  console.log("   1. Review the groupings above");
  console.log("   2. Adjust LANGUAGE_GROUPS in migrate-crates.js if needed");
  console.log("   3. Run: node migrate-crates.js --dry-run");
  console.log("   4. Run: node migrate-crates.js (to execute)");
}

if (require.main === module) {
  main().catch(console.error);
}
