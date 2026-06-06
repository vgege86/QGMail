import { useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import EmailList from "../components/EmailList";
import ComposeModal from "../components/ComposeModal";

const LABEL_NAMES: Record<string, string> = {
  INBOX: "Bandeja de entrada",
  SENT: "Enviados",
  DRAFT: "Borradores",
  TRASH: "Papelera",
};

export default function InboxPage({ label: propLabel }: { label?: string }) {
  const { labelId } = useParams();
  const label = propLabel ?? labelId ?? "INBOX";
  const [composing, setComposing] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar onCompose={() => setComposing(true)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">
            {LABEL_NAMES[label] ?? label}
          </h1>
        </header>
        <div className="flex-1 overflow-hidden">
          <EmailList label={label} />
        </div>
      </div>

      {composing && <ComposeModal onClose={() => setComposing(false)} />}
    </div>
  );
}
