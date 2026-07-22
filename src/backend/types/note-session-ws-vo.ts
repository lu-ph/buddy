export interface WSNoteSessionInit {
  type: "note_init";
  filePath: string;
  fileContent: string;
}

// server -> client
export interface WSNoteChange {
  type: "note_change";
  newContent: string;
}

// client -> server
export interface WSUpdateUserEditedNote {
  type: "update_user_edited_note";
  newContent: string;
}

export type ServerToClientNoteMsg =
  | WSNoteChange
  | WSNoteSessionInit

export type ClientToServerNoteMsg = WSUpdateUserEditedNote