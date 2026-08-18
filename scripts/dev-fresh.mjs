#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";

function killPort(port) {
  try {
    const out = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).trim();
    if (!out) return;
    for (const pid of out.split("\n")) {
      if (!pid) continue;
      console.log(`Deteniendo proceso ${pid} (puerto ${port})…`);
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {
        // already gone
      }
    }
  } catch {
    // nothing listening
  }
}

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // wait for processes to release .next/dev
  }
}

function rmDevCache() {
  try {
    fs.rmSync(".next/dev", {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  } catch (err) {
    console.warn("No se pudo limpiar .next/dev:", err.message);
  }
}

function checkNodeArch() {
  if (process.arch !== "arm64" && process.platform === "darwin") {
    console.warn(
      "\n⚠️  Node está en x64 (Rosetta). En Mac Apple Silicon usá:\n" +
        "   nvm use\n" +
        "   rm -rf node_modules .next && npm install\n\n",
    );
  }
}

killPort(3000);
killPort(3001);
sleep(500);
rmDevCache();
checkNodeArch();

console.log("Iniciando Myca$h en http://localhost:3000 …\n");

const child = spawn("next", ["dev", "--webpack"], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
