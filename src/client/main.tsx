import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import NotePanel from "./note-panel/NotePanel";
import PDFViewer from "./pdf-viewer/PDFViewer";
import PresentationWindow from "./presentation-window/PresentationWindow";
import "./index.css";
import { AgentPanel } from "./agent-panel/AgentPanel";

const App = () => {
  const path = window.location.pathname;

  switch (path) {
    case "/":
      return (
        <StrictMode>
          <AgentPanel />
        </StrictMode>
      );

    case "/pdfviewer":
      return (
        <StrictMode>
          <PDFViewer />
        </StrictMode>
      );

    case "/notepanel":
      return (
        <StrictMode>
          <NotePanel />
        </StrictMode>
      );

    case "/presentation-window": {
      return (
        <StrictMode>
          <PresentationWindow />
        </StrictMode>
      );
    }

    default:
      return (
        <StrictMode>
          <div style={{ padding: 24, fontFamily: "sans-serif" }}>
            <h1>404</h1>
          </div>
        </StrictMode>
      );
  }
};

createRoot(document.getElementById("root")!).render(<App />);
