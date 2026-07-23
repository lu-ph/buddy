export type ServerToClientPDFMessage =
  WSJumpToPage | WSPDFNextPage | WSPDFPreviousPage;

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

export type ClientToServerPDFMessage = WSGetPDF;

// client -> server
interface WSGetPDF {
  type: "get_pdf";
  pdfPath: string;
}

// server -> client
// interface WSSendPDF {
// 	type: "send_pdf"
// 	pdfBuffer: Buffer
// }
