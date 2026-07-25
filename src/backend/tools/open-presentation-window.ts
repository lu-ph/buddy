import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { exec } from "child_process";
import path from "path";
import { z } from "zod";

export function createPresentationWindowMcpServer(): any {
  return createSdkMcpServer({
    name: "presentation-window",
    version: "1.0.0",
    tools: [
      {
        name: "open_presentation_window",
        description:
          "Open a PDF in the browser for explaining concepts or other uses. Opens the browser to localhost:5173/pdfviewer?filePath=xxx.pdf.",
        inputSchema: z.object({
          pdfPath: z.string().describe("Absolute path to the PDF file"),
          notePath: z.string().describe("Absolute path to the note file")
        }),
        handler: async ({ pdfPath, notePath }) => {
          const absolutePDFPath = path.resolve(pdfPath as string);
          const absoluteNotePath = path.resolve(notePath as string)
          const targetUrl = `http://localhost:5173/presentation-window?pdfPath=${encodeURIComponent(
            absolutePDFPath,
          )}&notePath=${encodeURIComponent(
            absoluteNotePath
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
                text: `Opened Presentation window for PDF ${absolutePDFPath}, Note ${absoluteNotePath}`,
              },
            ],
          };
        },
      },
    ],
  });
}
