export type ServerToClientPDFMessage =
  | WSJumpToPage 
  | WSPDFNextPage 
  | WSPDFPreviousPage
  | WSPDFErrorMessage

interface WSJumpToPage {
  type: "jump_to_page";
  pageNum: number;
}

interface WSPDFNextPage {
  type: "next_page";
}

interface WSPDFPreviousPage {
  type: "previous_page";
}

interface WSPDFErrorMessage {
  type: "pdf_session_error"
  message: string
}

export type ClientToServerPDFMessage = 
  | WSGetPDF
  | WSPDFErrorMessage

// client -> server
interface WSGetPDF {
  type: "get_pdf";
  pdfPath: string;
}
