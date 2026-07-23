import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import NotePanel from "./note-panel/NotePanel";
import PDFViewer from "./pdf-viewer/PDFViewer";

const App = () => {
  const path = window.location.pathname;

  if (path === "/pdfviewer") {
    return (
      <StrictMode>
        <PDFViewer />
      </StrictMode>
    );
  }

  if (path === "/notepanel" || path === "/") {
    return (
      <StrictMode>
        <NotePanel />
      </StrictMode>
    );
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
