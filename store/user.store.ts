import { IUserStore } from "@/types/client.types";
import { create } from "zustand";

const useUser = create<IUserStore>((set) => ({
  user: undefined,
  setUser: (user) => set({ user }),
}));

export { useUser };
