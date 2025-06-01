import { editTestStore } from "@/types/client.types";
import { create } from "zustand";

const useEditTest = create<editTestStore>((set) => ({
  data: undefined,
  setData(payload) {
    set((state) => ({
      ...state,
      data: { ...payload },
    }));
  },
  currentStep: 0,
  navigateToStep(step) {
    set((state) => ({
      ...state,
      currentStep: step,
    }));
  },
  isLoading: false,
  setIsLoading(isLoading) {
    set((state) => ({
      ...state,
      isLoading,
    }));
  },
}));

export { useEditTest };
