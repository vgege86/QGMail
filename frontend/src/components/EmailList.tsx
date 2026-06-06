import { useState } from "react";
import { Link } from "react-router-dom";
import { useEmails } from "../hooks/useEmails";
import { MessageSummary } from "../api/types";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const sameYear = d.getFullYear() === now.getFullYear();
  if (sameYear) return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function extractName(from: string) {
  const m = from.match(/^"?([^"<]+)"?\s*</);
  return m ? m[1].trim() : from.split("@")[0];
}

export default function EmailList({ label }: { label: string }) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [pageTokenStack, setPageTokenStack] = useState<(string | undefined)[]>([undefined]);
  const currentPage = pageTokenStack.length - 1;
  const currentToken = pageTokenStack[currentPage];

  const { data, isLoading, isError } = useEmails(label, search, currentToken);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(query);
    setPageTokenStack([undefined]);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className="flex gap-2 p-3 border-b border-gray-200 bg-white"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en correos..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Buscar
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setQuery(""); setSearch(""); setPageTokenStack([undefined]); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-2"
          >
            ✕
          </button>
        )}
      </form>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
        {isError && (
          <div className="p-8 text-center text-red-500">
            Error al cargar los mensajes.
          </div>
        )}
        {!isLoading && !isError && (data?.messages.length === 0) && (
          <div className="p-8 text-center text-gray-400">No hay mensajes.</div>
        )}
        {data?.messages.map((msg: MessageSummary) => (
          <Link
            key={msg.id}
            to={`/mail/${msg.id}`}
            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              msg.unread ? "bg-white" : "bg-gray-50"
            }`}
          >
            <div
              className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                msg.unread ? "bg-blue-500" : "bg-transparent"
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`text-sm truncate ${
                    msg.unread ? "font-semibold text-gray-900" : "font-normal text-gray-700"
                  }`}
                >
                  {extractName(msg.from || msg.to)}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatDate(msg.date)}
                </span>
              </div>
              <p
                className={`text-sm truncate ${
                  msg.unread ? "text-gray-800" : "text-gray-600"
                }`}
              >
                {msg.subject || "(Sin asunto)"}
              </p>
              <p className="text-xs text-gray-400 truncate">{msg.snippet}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white text-sm text-gray-600">
        <button
          disabled={currentPage === 0}
          onClick={() => setPageTokenStack((s) => s.slice(0, -1))}
          className="disabled:opacity-40 hover:text-blue-600 transition-colors"
        >
          ← Anterior
        </button>
        <span className="text-xs text-gray-400">Página {currentPage + 1}</span>
        <button
          disabled={!data?.nextPageToken}
          onClick={() =>
            data?.nextPageToken &&
            setPageTokenStack((s) => [...s, data.nextPageToken!])
          }
          className="disabled:opacity-40 hover:text-blue-600 transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
