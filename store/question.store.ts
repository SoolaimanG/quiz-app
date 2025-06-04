import { IQuestionStore } from "@/types/client.types";
import { IQuestion } from "@/types/index.types";
import { create } from "zustand";

const useQuestion = create<IQuestionStore>((set) => ({
  currentTest: "",
  setCurrentTest(test) {
    set((state) => ({
      ...state,
      currentTest: test,
    }));
  },
  questions: new Map(),
  setQuestions(questions) {
    set((state) => ({
      ...state,
      questions: new Map(
        questions.map((question) => [question._id!, question])
      ),
    }));
  },
  addQuestion(question) {
    set((state) => ({
      ...state,
      questions: new Map(state.questions).set(question._id!, question),
    }));
  },
  removeQuestion(questionId) {
    set((state) => ({
      ...state,
      questions: (() => {
        state?.questions?.delete(questionId);
        return state?.questions;
      })(),
    }));
  },
  editQuestion(questionId, payload) {
    set((state) => ({
      ...state,
      questions: new Map(state.questions).set(questionId, payload as IQuestion),
    }));
  },
  isLoading: false,
  setIsLoading(isLoading) {
    set((state) => ({
      ...state,
      isLoading,
    }));
  },
  options: new Map(),
  addOption(payload) {
    set((state) => ({
      ...state,
      options: new Map(state.options).set(payload._id!, payload),
    }));
  },
  addOptions(options) {
    set((state) => ({
      ...state,
      options: new Map(options.map((option) => [option._id!, option])),
    }));
  },
  removeOption(optionId) {
    set((state) => ({
      ...state,
      options: (() => {
        state?.options?.delete(optionId);
        return state?.options;
      })(),
    }));
  },
  editOption(optionId, payload) {
    set((state) => ({
      ...state,
      options: new Map(state.options).set(optionId, payload),
    }));
  },
}));

export { useQuestion };
