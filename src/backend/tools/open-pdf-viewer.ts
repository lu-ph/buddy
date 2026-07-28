import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import path from "path";
import { z } from "zod";
import { openBrowser } from "../service/open-browser";

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

          openBrowser(targetUrl, [960, 0], [960, 1040]);

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
