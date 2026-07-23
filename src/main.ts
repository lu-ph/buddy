import { ChildProcess, spawn } from "node:child_process";
import path from "node:path";
import net from "node:net"

let backendProcess: ChildProcess | null = null;
let viteProcess: ChildProcess | null = null;

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
          reject(new Error(`Backend Server timeout on port ${port}`));
        }
      });
    }, 250);
  });
}

function startBackend(): Promise<void> {
  console.log("\x1b[36m[Main] 1/3 Starting Backend Server...\x1b[0m");

	const serverPath = path.join(__dirname, "backend", "server.ts")
	backendProcess = spawn(npxCmd, ["tsx", serverPath], {
    stdio: "inherit",
    shell: true,
  });
	return checkPortReady(3000);
}

function startViteFrontend(): void {
	console.log("\x1b[36m[Main] 2/3 Starting Vite Frontend...\x1b[0m");

  viteProcess = spawn(npmCmd, ["run", "dev:frontend"], {
    stdio: "inherit",
    shell: true,
  });
}

function launchCli() {
  console.log("\x1b[36m[Main] 3/3 Launching CLI in a new terminal window...\x1b[0m");

  const cliPath = path.join(__dirname, "client", "cli.ts");
  
	const relativeCliPath = path.relative(process.cwd(), cliPath);
  const command = `${npxCmd} tsx ${relativeCliPath}`;

  if (isWin) {
    spawn("cmd.exe", ["/c", "start", "", "cmd.exe", "/k", command], {
      detached: true,
      stdio: "ignore",
    });
  } else if (process.platform === "darwin") {
    spawn(
      "osascript",
      [
        "-e",
        `tell application "Terminal" to do script "cd '${process.cwd()}' && ${command}"`,
      ],
      {
        detached: true,
        stdio: "ignore",
      }
    );
  } else {
    spawn("x-terminal-emulator", ["-e", command], {
      detached: true,
      stdio: "ignore",
    });
  }
}

function setupGracefulShutdown() {
  const cleanup = () => {
    console.log("\n\x1b[33m[Main] Shutting down all processes...\x1b[0m");

    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }
    if (viteProcess) {
      viteProcess.kill();
      viteProcess = null;
    }

    process.exit(0);
  };

  process.on("SIGINT", cleanup); 
  process.on("SIGTERM", cleanup);
}

async function main() {
  setupGracefulShutdown();

  try {
    await startBackend();
    startViteFrontend();
    launchCli();
  } catch (err) {
    console.error("\x1b[31m[Main] Application failed to start:\x1b[0m", err);
    if (backendProcess) backendProcess.kill();
    if (viteProcess) viteProcess.kill();
    process.exit(1);
  }
}

main();