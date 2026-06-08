import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import prospectsHandler from "../api/prospects.js";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 3000);

loadLocalEnv(".env.local");
loadLocalEnv(".env");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function loadLocalEnv(fileName) {
  const filePath = join(root, fileName);
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;

    const value = match[2].replace(/^['"]|['"]$/g, "");
    process.env[match[1]] = value;
  }
}

function createMockResponse(serverResponse) {
  return {
    setHeader: (name, value) => serverResponse.setHeader(name, value),
    status(code) {
      serverResponse.statusCode = code;
      return this;
    },
    json(payload) {
      serverResponse.setHeader("Content-Type", "application/json; charset=utf-8");
      serverResponse.end(JSON.stringify(payload));
    }
  };
}

async function serveStatic(pathName, response) {
  const safePath = pathName === "/" ? "/index.html" : pathName;
  const filePath = resolve(root, `.${safePath}`);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream"
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  try {
    if (url.pathname === "/api/prospects") {
      await prospectsHandler(request, createMockResponse(response));
      return;
    }

    await serveStatic(url.pathname, response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(port, () => {
  console.log(`ALIENXIP Prospects Dashboard local: http://localhost:${port}`);
});
