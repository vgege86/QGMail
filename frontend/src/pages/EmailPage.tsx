import { useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import EmailDetail from "../components/EmailDetail";
import ComposeModal from "../components/ComposeModal";
import { useEmail } from "../hooks/useEmails";
import { MessageDetail } from "../api/types";

export default function EmailPage() {
  const { id } = useParams<{ id: string }>();
  const [composing, setComposing] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageDetail | undefined>();
  const [forwardOf, setForwardOf] = useState<MessageDetail | undefined>();
  const { data: msg } = useEmail(id ?? "");

  function handleReply() {
    setReplyTo(msg);
    setForwardOf(undefined);
    setComposing(true);
  }

  function handleForward() {
    setForwardOf(msg);
    setReplyTo(undefined);
    setComposing(true);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar onCompose={() => { setReplyTo(undefined); setForwardOf(undefined); setComposing(true); }} />

      <div className="flex-1 overflow-hidden bg-white">
        {id && (
          <EmailDetail
            id={id}
            onReply={handleReply}
            onForward={handleForward}
          />
        )}
      </div>

      {composing && (
        <ComposeModal
          onClose={() => setComposing(false)}
          replyTo={replyTo}
          forwardOf={forwardOf}
        />
      )}
    </div>
  );
}
