import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Label } from "../api/types";

export function useLabels() {
  return useQuery<Label[]>({
    queryKey: ["labels"],
    queryFn: () => api.get<Label[]>("/api/labels"),
  });
}
