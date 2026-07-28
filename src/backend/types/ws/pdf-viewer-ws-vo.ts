export type ServerToClientPDFMessage =
  WSJumpToPage | WSPDFNextPage | WSPDFPreviousPage | WSPDFErrorMessage;

interface WSJumpToPage {
  type: "pdf_jump_to_page";
  pageNum: number;
}

interface WSPDFNextPage {
  type: "pdf_next_page";
}

interface WSPDFPreviousPage {
  type: "pdf_previous_page";
}

interface WSPDFErrorMessage {
  type: "pdf_session_error";
  message: string;
}

export type ClientToServerPDFMessage = WSGetPDF | WSPDFErrorMessage;

// client -> server
interface WSGetPDF {
  type: "pdf_get";
  pdfPath: string;
}
