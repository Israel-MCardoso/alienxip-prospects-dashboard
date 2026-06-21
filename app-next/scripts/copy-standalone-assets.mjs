import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const standaloneDir = join(rootDir, ".next", "standalone");

function copyIfExists(source, destination) {
  if (!existsSync(source)) return;
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true });
}

copyIfExists(join(rootDir, ".next", "static"), join(standaloneDir, ".next", "static"));
copyIfExists(join(rootDir, "public"), join(standaloneDir, "public"));

console.log("Standalone assets copied.");
