import readline from "readline"
import WebSocket from "ws"
import dotenv from "dotenv"
import { ChildProcess, spawn } from "child_process";
import { ServerToClientMessage, WSChatMessageRequest } from "./types/agent-ws-vo";
import { WSChatClient } from "./ws/ws-chat-client";
import express from "express";
import path from "path";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
	output: process.stdout
})

const logger = {
	agent: (content: string) => {
    console.log(`\x1b[34mAgent: ${content}\x1b[0m`);
  },
  
  tool: (name: string, input: string) => {
    console.log(`\x1b[35m[Tool] ${name}: ${input}\x1b[0m`);
  },
  
  final: (success: boolean, cost: string, duration: string) => {
    console.log(`[Done] success=${success}, duration=${duration}, cost=${cost}\n`);
  },

  error: (text: string) => {
    console.log(`[Error] ${text}`);
  },

	system: (text: string) => {
    console.log(`[System] ${text}`);
  },
};

let client: WSChatClient;

function waitForPrompt(): void {
	rl.question("> ", (input) => {
		const trimmedInput = input.trim()

		if (trimmedInput.toLowerCase() === "exit") {
      logger.system("Closing connection...");
      client.close();
      rl.close();
      return;
    }

		if (!trimmedInput) {
			waitForPrompt()
			return
		}

		const chatRequest: WSChatMessageRequest = {
			type: "chat",
			content: trimmedInput
		}

    if (client.getWSReadyState() == WebSocket.OPEN) {
      client.sendChatMessage(JSON.stringify(chatRequest))
    } else {
      logger.error("WebSocket is not ready")
      waitForPrompt()
    }
	})
}

client = new WSChatClient(logger, waitForPrompt)


const app = express();

app.use(express.static(path.join(__dirname, "note-panel")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "note-panel", "index.html"));
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});


// let serverProcess: ChildProcess | null

// function startBackendServer() {
//   return new Promise<void>((resolve) => {
//     const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

//     serverProcess = spawn(npmCmd, ["run", "start"], {
//       stdio: ["ignore", "pipe", "pipe"],
//       detached: false,
//     });

//     serverProcess.stdout?.on("data", (data) => {
//       const output = data.toString();
//       if (output.includes("3000") || output.includes("listening")) {
//         resolve();
//       }
//     });

//     setTimeout(resolve, 1500);
//   });
// }