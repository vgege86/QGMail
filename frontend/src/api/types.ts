export interface User {
  authenticated: boolean;
  email: string;
  name: string;
  picture: string;
}

export interface MessageSummary {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  unread: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface MessageDetail extends MessageSummary {
  cc: string;
  html: string | null;
  plain: string | null;
  attachments: Attachment[];
}

export interface MessagesResponse {
  messages: MessageSummary[];
  nextPageToken: string | null;
  resultSizeEstimate: number;
}

export interface Label {
  id: string;
  name: string;
  type?: string;
  messagesTotal?: number;
  messagesUnread?: number;
}
