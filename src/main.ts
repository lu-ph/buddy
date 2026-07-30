import { ChildProcess, spawn, exec } from "node:child_process";
import path from "node:path";
import net from "node:net";
import dotenv from "dotenv";
import { openBrowser } from "./backend/service/open-browser";

let backendProcess: ChildProcess | null = null;
let viteProcess: ChildProcess | null = null;
let isShuttingDown = false;

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";
const npxCmd = isWin ? "npx.cmd" : "npx";

function checkPortReady(port: number, timeout = 10000): Promise<void> {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      const socket = new net.Socket();
      socket.connect(port, "127.0.0.1", () => {
        socket.destroy();
        clearInterval(timer);
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - startTime > timeout) {
          clearInterval(timer);
          reject(new Error(`[Timeout] Backend Server didn't start on port ${port}`));
        }
      });
    }, 250);
  });
}

function killProcess(cp: ChildProcess | null) {
  if (!cp || !cp.pid) return;
  if (isWin) {
    exec(`taskkill /pid ${cp.pid} /T /F`, () => {});
  } else {
    cp.kill("SIGTERM");
  }
}

function cleanupAndExit(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log("\n\x1b[33m[Main] Shutting down all processes...\x1b[0m");

  killProcess(backendProcess);
  killProcess(viteProcess);
  
  process.exit(code);
}

async function startBackend(): Promise<void> {
  console.log("\x1b[36m[Main] 1/3 Starting Backend Server...\x1b[0m");
  const serverPath = path.join(__dirname, "backend", "server.ts");
  
  backendProcess = spawn(npxCmd, ["tsx", serverPath], {
    stdio: "inherit",
    shell: true,
  });

  backendProcess.on("exit", (code) => {
    if (!isShuttingDown) {
      console.error(`\x1b[31m[Error] Backend process exited unexpectedly with code ${code}\x1b[0m`);
      cleanupAndExit(1);
    }
  });

  await checkPortReady(3000);
}

function startViteFrontend(): void {
  console.log("\x1b[36m[Main] 2/3 Starting Vite Frontend...\x1b[0m");
  
  viteProcess = spawn(npmCmd, ["run", "dev:frontend"], {
    stdio: "inherit",
    shell: true,
  });

  viteProcess.on("exit", (code) => {
    if (!isShuttingDown) {
      console.error(`\x1b[31m[Error] Vite process exited unexpectedly with code ${code}\x1b[0m`);
      cleanupAndExit(1);
    }
  });
}

function openAgentPanel() {
  console.log("\x1b[36m[Main] 3/3 Launching agent panel...\x1b[0m");
  dotenv.config();

  const FRONTEND_PORT = process.env.FRONTEND_PORT || 5173;
  const targetUrl = `http://localhost:${FRONTEND_PORT}`;

  try {
    openBrowser(
      targetUrl,
      undefined,
      [400, 300],
    );  
    console.log(`\x1b[32m[System] Browser launched successfully. (Press Ctrl+C to stop all servers)\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31m[Error] Failed launching browser: \n${error}\x1b[0m`);
  }
}

function setupGracefulShutdown() {
  process.on("SIGINT", () => cleanupAndExit(0));  
  process.on("SIGTERM", () => cleanupAndExit(0)); 
  process.on("uncaughtException", (err) => {
    console.error("\x1b[31m[Main] Uncaught Exception:\x1b[0m", err);
    cleanupAndExit(1);
  });
}

async function main() {
  setupGracefulShutdown();

  try {
    await startBackend();
    startViteFrontend();
    openAgentPanel();
  } catch (err) {
    console.error("\x1b[31m[Main] Application failed to start:\x1b[0m", err);
    cleanupAndExit(1);
  }
}

main();