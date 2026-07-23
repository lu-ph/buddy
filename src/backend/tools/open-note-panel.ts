import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { exec } from "child_process";
import path from "path";
import { z } from "zod";

export function createNotePanelMcpServer(): any {
	return createSdkMcpServer({
		name: "note-panel",
		version: "1.0.0",
		tools: [
			{
				name: "note_panel",
				description: "Open a real-time synchronized note preview/editor window on the right side of the desktop. Directly modify the source file to update the NotePanel preview in real time.",
				inputSchema: z.object({
					filePath: z.string().describe("Path to the note file (absolute paths)"),
				}),
				handler: async ({ filePath }) => {
					const absolutePath = path.resolve(filePath as string);
					const targetUrl = `http://localhost:3000/?filePath=${encodeURIComponent(absolutePath)}`;

					const flags = `--app="${targetUrl}" --window-position=960,0 --window-size=960,1040`;
					const cmd = process.platform === "win32" 
						? `start chrome ${flags} || start msedge ${flags}` 
						: `open -n -a "Google Chrome" --args ${flags}`;

					exec(cmd);

					return {
						content: [{ type: "text", text: `Opened note preview in right-side window: ${absolutePath}` }],
					};
				},
			},
		],
	});
}