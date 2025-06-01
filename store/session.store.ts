import { ISessionStore } from "@/types/client.types";
import { create } from "zustand";

const useSession = create<ISessionStore>((set) => ({
  sessionToken: "",
  setSessionToken(sessionToken) {
    set((state) => ({
      ...state,
      sessionToken,
    }));
  },
}));

export { useSession };
