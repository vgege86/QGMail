import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { User } from "../api/types";

export function useAuth() {
  return useQuery<User>({
    queryKey: ["auth"],
    queryFn: () => api.get<User>("/auth/me"),
    retry: false,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout", {}),
    onSuccess: () => {
      qc.setQueryData(["auth"], { authenticated: false });
      qc.clear();
    },
  });
}
