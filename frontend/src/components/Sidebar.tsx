import { NavLink } from "react-router-dom";
import { useLabels } from "../hooks/useLabels";
import { useAuth, useLogout } from "../hooks/useAuth";
import { Label } from "../api/types";

const SYSTEM_LABELS: { id: string; name: string; icon: string; path: string }[] = [
  { id: "INBOX", name: "Bandeja", icon: "📥", path: "/inbox" },
  { id: "SENT", name: "Enviados", icon: "📤", path: "/sent" },
  { id: "DRAFT", name: "Borradores", icon: "📝", path: "/drafts" },
  { id: "TRASH", name: "Papelera", icon: "🗑️", path: "/trash" },
];

function labelStyle(active: boolean) {
  return `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
    active
      ? "bg-blue-100 text-blue-700 font-semibold"
      : "text-gray-700 hover:bg-gray-100"
  }`;
}

export default function Sidebar({ onCompose }: { onCompose: () => void }) {
  const { data: labels } = useLabels();
  const { data: user } = useAuth();
  const logout = useLogout();

  const userLabels =
    labels?.filter(
      (l: Label) =>
        l.type === "user" && l.name && !l.name.startsWith("CATEGORY_")
    ) ?? [];

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full bg-white border-r border-gray-200 p-3">
      <div className="flex items-center gap-2 px-2 mb-4">
        <span className="text-2xl">📧</span>
        <span className="font-bold text-gray-800 text-lg">QGMail</span>
      </div>

      <button
        onClick={onCompose}
        className="mb-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <span>✏️</span> Redactar
      </button>

      <nav className="flex-1 overflow-y-auto space-y-0.5">
        {SYSTEM_LABELS.map((l) => (
          <NavLink
            key={l.id}
            to={l.path}
            className={({ isActive }) => labelStyle(isActive)}
          >
            <span>{l.icon}</span>
            <span>{l.name}</span>
          </NavLink>
        ))}

        {userLabels.length > 0 && (
          <>
            <div className="pt-3 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Etiquetas
            </div>
            {userLabels.map((l: Label) => (
              <NavLink
                key={l.id}
                to={`/label/${l.id}`}
                className={({ isActive }) => labelStyle(isActive)}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="truncate">{l.name}</span>
                {l.messagesUnread ? (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 rounded-full px-1.5">
                    {l.messagesUnread}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {user?.authenticated && (
        <div className="mt-3 border-t pt-3">
          <div className="flex items-center gap-2 px-2 mb-2">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-7 h-7 rounded-full"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                {user.name?.[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout.mutate()}
            className="w-full text-xs text-gray-500 hover:text-red-600 px-2 py-1 text-left transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
}
