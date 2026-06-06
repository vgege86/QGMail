import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { MessagesResponse, MessageDetail } from "../api/types";

export function useEmails(label: string, query: string, pageToken?: string) {
  const params = new URLSearchParams({ label, q: query });
  if (pageToken) params.set("pageToken", pageToken);

  return useQuery<MessagesResponse>({
    queryKey: ["messages", label, query, pageToken],
    queryFn: () => api.get<MessagesResponse>(`/api/messages?${params}`),
    enabled: true,
  });
}

export function useEmail(id: string) {
  return useQuery<MessageDetail>({
    queryKey: ["message", id],
    queryFn: () => api.get<MessageDetail>(`/api/messages/${id}`),
    enabled: !!id,
  });
}

export function useMarkRead(messageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (unread: boolean) =>
      api.patch(`/api/messages/${messageId}`, {
        addLabelIds: unread ? ["UNREAD"] : [],
        removeLabelIds: unread ? [] : ["UNREAD"],
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}

export function useArchive(messageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.patch(`/api/messages/${messageId}`, { removeLabelIds: ["INBOX"] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}

export function useTrash(messageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/messages/${messageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}
