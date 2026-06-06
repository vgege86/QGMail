import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import InboxPage from "./pages/InboxPage";
import EmailPage from "./pages/EmailPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data?.authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Routes>
                <Route path="/" element={<Navigate to="/inbox" replace />} />
                <Route path="/inbox" element={<InboxPage label="INBOX" />} />
                <Route path="/sent" element={<InboxPage label="SENT" />} />
                <Route path="/drafts" element={<InboxPage label="DRAFT" />} />
                <Route path="/trash" element={<InboxPage label="TRASH" />} />
                <Route path="/label/:labelId" element={<InboxPage />} />
                <Route path="/mail/:id" element={<EmailPage />} />
              </Routes>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
