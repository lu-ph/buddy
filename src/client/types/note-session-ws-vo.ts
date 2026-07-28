// client -> server
export interface WSNoteSessionInit {
  type: "note_init";
  filePath: string;
}

export interface WSNoteSessionInitResp {
  type: "note_init_resp";
  fileContent: string;
}

// server -> client
export interface WSNoteChange {
  type: "note_change";
  newContent: string;
}

// client -> server
export interface WSUpdateUserEditedNote {
  type: "note_user_edited";
  newContent: string;
}

export interface WSNoteSessionClientErrorMessage {
  type: "note_client_error";
  message: string;
}

export interface WSNoteSessionBackendErrorMessage {
  type: "backend_error";
  message: string;
}

export type ServerToClientNoteMsg =
  WSNoteChange | WSNoteSessionInitResp | WSNoteSessionBackendErrorMessage;

export type ClientToServerNoteMsg =
  WSUpdateUserEditedNote | WSNoteSessionInit | WSNoteSessionClientErrorMessage;
