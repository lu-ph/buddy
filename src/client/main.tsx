import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import NotePanel from "./note-panel/NotePanel";
import PDFViewer from "./pdf-viewer/PDFViewer";
import PresentationWindow from "./presentation-window/PresentationWindow";
import "./index.css"

const App = () => {
  const path = window.location.pathname;

  if (path === "/pdfviewer") {
    return (
      <StrictMode>
        <PDFViewer />
      </StrictMode>
    );
  }

  if (path === "/notepanel") {
    return (
      <StrictMode>
        <NotePanel />
      </StrictMode>
    );
  }

  if (path === "/presentation-window") {
    return (
      <StrictMode>
        <PresentationWindow />
      </StrictMode>
    )
  }

  return (
    <StrictMode>
      <div style={{ padding: 24, fontFamily: "sans-serif" }}>
        <h1>404</h1>
      </div>
    </StrictMode>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
