import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { useEmail, useMarkRead, useArchive, useTrash } from "../hooks/useEmails";
import { Attachment } from "../api/types";

function AttachmentItem({ att, messageId }: { att: Attachment; messageId: string }) {
  const url = `/api/attachments/${messageId}/${att.id}?filename=${encodeURIComponent(att.filename)}&mimeType=${encodeURIComponent(att.mimeType)}`;
  const kb = (att.size / 1024).toFixed(1);
  return (
    <a
      href={url}
      download={att.filename}
      className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
    >
      <span className="text-xl">{att.mimeType.startsWith("image/") ? "🖼️" : att.mimeType === "application/pdf" ? "📄" : "📎"}</span>
      <div className="min-w-0">
        <p className="truncate font-medium text-gray-800">{att.filename}</p>
        <p className="text-xs text-gray-400">{kb} KB</p>
      </div>
    </a>
  );
}

export default function EmailDetail({ id, onReply, onForward }: {
  id: string;
  onReply: () => void;
  onForward: () => void;
}) {
  const { data: msg, isLoading, isError } = useEmail(id);
  const navigate = useNavigate();
  const markRead = useMarkRead(id);
  const archive = useArchive(id);
  const trash = useTrash(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError || !msg) {
    return <div className="p-8 text-red-500">Error al cargar el mensaje.</div>;
  }

  const sanitizedHtml = msg.html
    ? DOMPurify.sanitize(msg.html, { USE_PROFILES: { html: true } })
    : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors"
          title="Volver"
        >
          ← Volver
        </button>
        <div className="flex-1" />
        <button
          onClick={() => markRead.mutate(msg.unread)}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {msg.unread ? "Marcar leído" : "Marcar no leído"}
        </button>
        <button
          onClick={() => archive.mutate(undefined, { onSuccess: () => navigate(-1) })}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          📥 Archivar
        </button>
        <button
          onClick={() => trash.mutate(undefined, { onSuccess: () => navigate(-1) })}
          className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
        >
          🗑️ Eliminar
        </button>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          {msg.subject || "(Sin asunto)"}
        </h1>

        <div className="flex flex-col gap-1 mb-4 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-400 w-10 shrink-0">De:</span>
            <span className="text-gray-800">{msg.from}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400 w-10 shrink-0">Para:</span>
            <span className="text-gray-800">{msg.to}</span>
          </div>
          {msg.cc && (
            <div className="flex gap-2">
              <span className="text-gray-400 w-10 shrink-0">CC:</span>
              <span className="text-gray-800">{msg.cc}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-gray-400 w-10 shrink-0">Fecha:</span>
            <span className="text-gray-600">{msg.date}</span>
          </div>
        </div>

        {/* Reply/Forward buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={onReply}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ↩ Responder
          </button>
          <button
            onClick={onForward}
            className="text-sm px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ↪ Reenviar
          </button>
        </div>

        {/* Body */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          {sanitizedHtml ? (
            <iframe
              srcDoc={sanitizedHtml}
              sandbox="allow-same-origin"
              className="w-full border-none"
              style={{ minHeight: "400px" }}
              onLoad={(e) => {
                const iframe = e.currentTarget;
                const body = iframe.contentDocument?.body;
                if (body) {
                  iframe.style.height = body.scrollHeight + "px";
                }
              }}
            />
          ) : (
            <pre className="whitespace-pre-wrap p-4 text-sm text-gray-800 font-sans">
              {msg.plain || msg.snippet}
            </pre>
          )}
        </div>

        {/* Attachments */}
        {msg.attachments.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Adjuntos ({msg.attachments.length})
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {msg.attachments.map((att: Attachment) => (
                <AttachmentItem key={att.id} att={att} messageId={id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
