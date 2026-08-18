#!/usr/bin/env node
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tag = `${process.platform}-${process.arch}`;

try {
  require("lightningcss");
} catch {
  console.error(`\n❌ Falta el binario nativo de lightningcss para ${tag}.\n`);

  if (process.platform === "darwin" && process.arch === "x64") {
    console.error(
      "En Mac Apple Silicon estás corriendo Node x64 (Rosetta).\n" +
        "Usá Node arm64 nativo:\n\n" +
        "  nvm use\n" +
        "  rm -rf node_modules .next\n" +
        "  npm install\n" +
        "  npm run dev:fresh\n",
    );
  } else {
    console.error(
      "Reinstalá dependencias nativas:\n\n" +
        "  rm -rf node_modules .next\n" +
        "  npm install\n",
    );
  }

  process.exit(1);
}
