import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { exec } from "child_process";
import path from "path";
import { z } from "zod";

export function createPdfViewerMcpServer(): any {
  return createSdkMcpServer({
    name: "pdf-viewer",
    version: "1.0.0",
    tools: [
      {
        name: "pdf_viewer",
        description:
          "Open a PDF in the browser for explaining concepts or other uses. Opens the browser to localhost:5173/pdfviewer?filePath=xxx.pdf.",
        inputSchema: z.object({
          filePath: z.string().describe("Absolute path to the PDF file"),
        }),
        handler: async ({ filePath }) => {
          const absolutePath = path.resolve(filePath as string);
          const targetUrl = `http://localhost:5173/pdfviewer?filePath=${encodeURIComponent(
            absolutePath,
          )}`;

          const flags = `--app="${targetUrl}" --window-position=960,0 --window-size=960,1040`;
          const cmd =
            process.platform === "win32"
              ? `start chrome ${flags} || start msedge ${flags}`
              : `open -n -a "Google Chrome" --args ${flags}`;

          exec(cmd);

          return {
            content: [
              {
                type: "text",
                text: `Opened PDF viewer window for: ${absolutePath}`,
              },
            ],
          };
        },
      },
    ],
  });
}
