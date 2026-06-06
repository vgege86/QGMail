import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sendEmail } from "../api/client";
import { MessageDetail } from "../api/types";

interface ComposeProps {
  onClose: () => void;
  replyTo?: MessageDetail;
  forwardOf?: MessageDetail;
}

export default function ComposeModal({ onClose, replyTo, forwardOf }: ComposeProps) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const initialTo = replyTo?.from ?? "";
  const initialSubject = replyTo
    ? `Re: ${replyTo.subject}`
    : forwardOf
    ? `Fwd: ${forwardOf.subject}`
    : "";
  const initialBody = replyTo
    ? `\n\n--- Mensaje original ---\nDe: ${replyTo.from}\nFecha: ${replyTo.date}\nAsunto: ${replyTo.subject}\n\n${replyTo.plain ?? ""}`
    : forwardOf
    ? `\n\n--- Mensaje reenviado ---\nDe: ${forwardOf.from}\nFecha: ${forwardOf.date}\nAsunto: ${forwardOf.subject}\n\n${forwardOf.plain ?? ""}`
    : "";

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCc, setShowCc] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim()) { setError("El campo 'Para' es obligatorio."); return; }
    setSending(true);
    setError(null);

    const form = new FormData();
    form.append("to", to);
    if (cc) form.append("cc", cc);
    form.append("subject", subject);
    form.append("body", body);
    form.append("isHtml", "false");
    if (replyTo) {
      form.append("threadId", replyTo.threadId);
      form.append("inReplyTo", replyTo.id);
      form.append("references", replyTo.id);
    }
    if (forwardOf) {
      form.append("threadId", forwardOf.threadId);
    }
    for (const f of files) form.append("attachments", f);

    try {
      await sendEmail(form);
      qc.invalidateQueries({ queryKey: ["messages"] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">
            {replyTo ? "Responder" : forwardOf ? "Reenviar" : "Nuevo mensaje"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <label className="text-sm text-gray-500 w-14 shrink-0">Para:</label>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="destinatario@ejemplo.com"
                  className="flex-1 text-sm outline-none text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowCc((v) => !v)}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  CC
                </button>
              </div>

              {showCc && (
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <label className="text-sm text-gray-500 w-14 shrink-0">CC:</label>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@ejemplo.com"
                    className="flex-1 text-sm outline-none text-gray-800"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <label className="text-sm text-gray-500 w-14 shrink-0">Asunto:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto del mensaje"
                  className="flex-1 text-sm outline-none text-gray-800"
                />
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full text-sm outline-none resize-none text-gray-800 pt-1"
              />

              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {files.map((f, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 text-xs bg-gray-100 rounded-lg px-2 py-1"
                    >
                      📎 {f.name}
                      <button
                        type="button"
                        onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="px-5 py-2 text-sm text-red-600 bg-red-50">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={sending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-xl transition-colors"
            >
              {sending ? "Enviando..." : "Enviar"}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              📎 Adjuntar
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) =>
                setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])
              }
            />
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Descartar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
