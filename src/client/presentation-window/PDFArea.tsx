import React, { useEffect, useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { usePdfWebSocket } from "./ws-handler";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PDFViewerPanel: React.FC<{ filePath: string | null }> = ({
  filePath,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handleJumpToPage = (pageNum: number) => {
    const maxPage = numPages > 0 ? numPages : Infinity;
    const safePageNum = Math.min(Math.max(pageNum, 1), maxPage as number);
    setCurrentPage(safePageNum);

    virtuosoRef.current?.scrollToIndex({
      index: safePageNum - 1,
      align: "center",
      behavior: "auto",
    });
  };

  const { pdfData } = usePdfWebSocket(filePath, handleJumpToPage);
  const file = React.useMemo(
    () => (pdfData ? { data: pdfData } : null),
    [pdfData],
  );

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc] font-sans border-r border-[#3c3c3c]">
      <div className="sticky top-0 z-10 flex justify-between items-center px-[20px] py-[8px] bg-[#252526] border-b border-[#3c3c3c] shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
        <div className="text-[15px] text-[#cccccc] tracking-[0.5px] flex items-center gap-[8px]">
          <span>页码：</span>
          <input
            type="text"
            value={pageInput}
            onChange={(event) => {
              const val = event.target.value;
              setPageInput(val);

              const parsed = parseInt(val, 10);
              const maxPage = numPages > 0 ? numPages : Infinity;

              if (!isNaN(parsed) && parsed >= 1 && parsed <= maxPage) {
                handleJumpToPage(parsed);
              }
            }}
            onBlur={() => {
              setPageInput(currentPage.toString());
            }}
            className="w-[50px] rounded-[4px] border border-[#555555] bg-[#1e1e1e] px-[8px] py-[4px] text-[15px] text-white focus:outline-none focus:border-[#0e639c] text-center"
            aria-label="输入页码跳转"
          />
          <span className="text-[#cccccc]">/ {numPages}</span>
        </div>
        <div className="flex gap-[8px]">
          <button
            disabled={currentPage <= 1}
            onClick={() => handleJumpToPage(Math.max(currentPage - 1, 1))}
            className="bg-[#0e639c] text-white border-none rounded-[2px] px-[14px] py-[6px] text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[#1177bb]"
          >
            上一页
          </button>
          <button
            disabled={currentPage >= numPages && numPages > 0}
            onClick={() =>
              handleJumpToPage(
                Math.min(currentPage + 1, numPages > 0 ? numPages : Infinity),
              )
            }
            className="bg-[#0e639c] text-white border-none rounded-[2px] px-[14px] py-[6px] text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[#1177bb]"
          >
            下一页
          </button>
        </div>
      </div>

      <div className="flex-1 w-full h-full bg-[#1e1e1e]">
        {file && (
          <Document
            file={file}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            className="w-full h-full flex justify-center"
          >
            <Virtuoso
              ref={virtuosoRef}
              style={{ width: "800px", height: "100%" }}
              totalCount={numPages}
              itemContent={(index) => (
                <div className="mb-[12px] bg-white rounded-[2px] shadow-[0_4px_10px_rgba(0,0,0,0.3)] min-h-[1130px] w-[800px] flex justify-center">
                  <Page
                    pageNumber={index + 1}
                    width={800}
                    loading={
                      <div className="flex h-[1130px] w-[800px] items-center justify-center bg-[#2d2d2d] text-[#a0a0a0] text-[15px] font-medium tracking-wide">
                        Loading Page {index + 1}...
                      </div>
                    }
                  />
                </div>
              )}
            />
          </Document>
        )}
      </div>
    </div>
  );
};

export default PDFViewerPanel;
