import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { usePdfWebSocket } from "./ws-handler";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PDFViewer: React.FC = () => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const searchParams = new URLSearchParams(window.location.search);
  const filePath = searchParams.get("filePath");

  const handleJumpToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
    const pageElement = document.getElementById(`pdf-page-${pageNum}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const { pdfData } = usePdfWebSocket(filePath, handleJumpToPage);
  const file = React.useMemo(
    () => (pdfData ? { data: pdfData } : null),
    [pdfData],
  );

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <span style={styles.pageInfo}>
          页码：<strong style={styles.pageHighlight}>{currentPage}</strong> /{" "}
          {numPages}
        </span>
        <div>
          <button
            disabled={currentPage <= 1}
            onClick={() => handleJumpToPage(Math.max(currentPage - 1, 1))}
            style={{
              ...styles.button,
              opacity: currentPage <= 1 ? 0.4 : 1,
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
            }}
          >
            上一页
          </button>
          <button
            disabled={currentPage >= numPages}
            onClick={() =>
              handleJumpToPage(Math.min(currentPage + 1, numPages))
            }
            style={{
              ...styles.button,
              marginLeft: 8,
              opacity: currentPage >= numPages ? 0.4 : 1,
              cursor: currentPage >= numPages ? "not-allowed" : "pointer",
            }}
          >
            下一页
          </button>
        </div>
      </div>

      <div style={styles.pdfWrapper}>
        {file && (
          <Document
            file={file}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          >
            {Array.from(new Array(numPages), (_, index) => {
              const pageNum = index + 1;
              return (
                <div
                  key={`page_${pageNum}`}
                  id={`pdf-page-${pageNum}`}
                  style={{
                    ...styles.pageContainer,
                    border:
                      pageNum === currentPage
                        ? "2px solid #007acc"
                        : "1px solid #2d2d2d",
                    boxShadow:
                      pageNum === currentPage
                        ? "0 0 12px rgba(0, 122, 204, 0.4)"
                        : "0 4px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  <Page
                    pageNumber={pageNum}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    width={800}
                  />
                </div>
              );
            })}
          </Document>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#1e1e1e",
    color: "#cccccc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  toolbar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 20px",
    backgroundColor: "#252526",
    borderBottom: "1px solid #3c3c3c",
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  pageInfo: {
    fontSize: "15px",
    color: "#cccccc",
    letterSpacing: "0.5px",
  },
  pageHighlight: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#ffffff",
    padding: "0 2px",
  },
  button: {
    backgroundColor: "#0e639c",
    color: "#ffffff",
    border: "none",
    borderRadius: "2px",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: 500,
    transition: "background-color 0.2s",
  },
  pdfWrapper: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    justifyContent: "center",
    padding: "12px 0",
  },
  pageContainer: {
    marginBottom: 8,
    backgroundColor: "#ffffff",
    borderRadius: 2,
    transition: "all 0.2s ease",
  },
};

export default PDFViewer;
