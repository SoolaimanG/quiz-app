import { ForwardRefExoticComponent, ReactNode, RefAttributes } from "react";
import {
  IOption,
  IQuestion,
  IRole,
  ITest,
  ITestSettings,
  IUser,
} from "./index.types";
import { LucideProps } from "lucide-react";

export interface ITestimonial {
  id: string;
  name: string;
  role: IRole;
  content: string;
  profilePicture: string;
}

export interface ISessionStore {
  sessionToken?: string;
  setSessionToken: (sessionToken?: string) => void;
}

export interface IUserStore {
  user?: Partial<IUser>;
  setUser: (user: Partial<IUser>) => void;
}

export interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number;
}

// Main response interface
export interface TestsResponse {
  tests: Partial<ITest>[];
  filterTestCount: number;
  pagination: Pagination;
}

export interface TestWithFlexibleSettings {
  _id: string;
  instructions: string;
  title: string;
  isActive: boolean;
  settings: Partial<ITestSettings>;
}

export interface FlexibleTestsResponse {
  tests: TestWithFlexibleSettings[];
  filterTestCount: number;
  pagination: Pagination;
}

export type IAccecptableFile = "image" | "documents";

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  uploaded: boolean;
}

export interface IUploadModal {
  children: ReactNode;
  acceptableFiles?: IAccecptableFile[];
  maxFileSize?: number;
  multiple?: boolean;
  open?: boolean;
  onClose?: () => void;
  // onUpload is called when the user clicks the upload button in the moda
  onUpload?: (files: UploadedFile[]) => void;
  onError?: (err?: string) => void;
}

export interface editTestStore {
  data?: Partial<ITest>;
  setData: (payload: Partial<ITest>) => void;

  currentStep: number;
  navigateToStep: (step: number) => void;

  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  lastUpdated?: Date;
  setLastUpdated: (lastUpdated?: Date) => void;
}

export interface IQuestionStore {
  currentTest?: string;
  setCurrentTest: (test?: string) => void;

  questions?: Map<string, IQuestion>;
  setQuestions: (questions: IQuestion[]) => void;
  addQuestion: (question: IQuestion) => void;
  removeQuestion: (questionId: string) => void;
  editQuestion: (questionId: string, payload: Partial<IQuestion>) => void;
  addOption: (payload: IOption) => void;
  removeOption: (optionId: string) => void;
  editOption: (optionId: string, payload: IOption) => void;
  addOptions: (options: IOption[]) => void;
  options: Map<string, IOption>;

  isLoading?: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export interface ITestConfigureList {
  id: keyof ITestSettings;
  description: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  useGrayColor?: boolean;
}
