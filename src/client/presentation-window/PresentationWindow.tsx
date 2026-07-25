import React, { useEffect, useRef, useState } from "react";
import PDFArea from "./PDFArea";
import Note from "./Note";

export const PDFNoteWorkspace: React.FC = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const pdfFilePath = searchParams.get("pdfPath");
  const noteFilePath = searchParams.get("notePath") || pdfFilePath;
  const [leftRatio, setLeftRatio] = useState(66.67);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      let nextRatio = ((event.clientX - rect.left) / rect.width) * 100;
      nextRatio = Math.min(90, Math.max(10, nextRatio));
      setLeftRatio(nextRatio);
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleDividerMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

  return (
    <div
      ref={wrapperRef}
      className="flex h-screen w-screen overflow-hidden bg-[#1e1e1e]"
    >
      <div
        className="h-full"
        style={{ width: `${leftRatio}%`, minWidth: "10%" }}
      >
        <PDFArea filePath={pdfFilePath} />
      </div>

      <div
        className="flex-shrink-0 cursor-col-resize bg-[#2d2d2d] hover:bg-[#3c3c3c]"
        style={{ width: 8 }}
        onMouseDown={handleDividerMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="调整左右面板宽度"
      />

      <div
        className="h-full"
        style={{ width: `${100 - leftRatio}%`, minWidth: "10%" }}
      >
        <Note filePath={noteFilePath} />
      </div>
    </div>
  );
};

export default PDFNoteWorkspace;