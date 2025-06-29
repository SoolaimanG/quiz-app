// ============================================
// FIXED UTILS CLASS
// ============================================

import axios, { AxiosInstance, AxiosProgressEvent } from "axios";
import accountCreationSchema from "@/validations/account-creation-schema";
import {
  IAnswer,
  IApiResponse,
  IOngoingTest,
  IOption,
  IQuestion,
  IStudent,
  ITeacher,
  ITest,
  ITestAttempt,
  IUser,
} from "@/types/index.types";
import { z } from "zod";
import loginSchema from "@/validations/login.schema";
import { requestPasswordReset } from "@/validations/forget-password.schema";
import { _CONSTANTS } from "./constants";
import { Pagination, TestsResponse } from "@/types/client.types";
import { createTestSchema } from "@/validations/test.schema";

export class Utils {
  api: AxiosInstance;
  private cloudName: string;
  private uploadPreset: string;

  constructor(sessionToken?: string) {
    this.api = axios.create({
      baseURL: process.env.URL,
      withCredentials: true,
      headers: {
        Cookie: `${_CONSTANTS.AUTH_HEADER}=${sessionToken}`,
      },
    });

    //Cloudinary config
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    this.uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
  }

  /**
   * ===============================================
   *                    HELPERS                    =
   * ===============================================
   */

  structureError<T = any>(error: any): IApiResponse<T> {
    if (error?.response) {
      const err = error.response.data as IApiResponse;
      return err;
    }

    const defaultError: IApiResponse = {
      status: false,
      statusCode: error?.code || 500,
      data: null,
      message: "Something went wrong",
    };

    return defaultError;
  }

  getInitials(name?: string) {
    if (!name) return;

    const names = name.split(" ");
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  }

  isPathMatching(
    targetPath: string,
    currentUrl: string,
    options?: { level?: number }
  ) {
    if (!options?.level) {
      options = {
        ...options,
        level: 1,
      };
    }

    const currentUrls = currentUrl.split("/");

    return targetPath === currentUrls[options.level!];
  }

  truncateString(
    w?: string,
    length = 10,
    options?: { addEllipse?: boolean; start?: number }
  ) {
    if (!w) return;

    const defaultOptions = {
      addEllipse: true,
      start: 0,
      ...options,
    };

    const slicedString = w.slice(defaultOptions.start, length);
    return defaultOptions.addEllipse ? slicedString + "..." : slicedString;
  }

  async uploadFile(
    files: File[],
    onUploadProgress?: (payload: AxiosProgressEvent) => void
  ) {
    const formData = new FormData();

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      //formData.append("upload_preset", this.uploadPreset);
      //formData.append("cloud_name", this.cloudName);

      // Optional: Add folder organization
      formData.append("folder", "uploads");

      // Optional: Add tags for better organization
      formData.append("tags", "user-upload");
    }

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 3000,
        onUploadProgress(progressEvent) {
          onUploadProgress?.(progressEvent);
        },
      }
    );
  }

  /**
   * ===============================================
   *                 AUTHENTICATIONS               =
   * ===============================================
   */

  async createAccount(payload: z.infer<typeof accountCreationSchema>) {
    try {
      const res = await this.api.post<
        IApiResponse<IUser & (IStudent | ITeacher)>
      >(`/api/auth/user/register`, payload);
      return res.data;
    } catch (error) {
      throw this.structureError(error);
    }
  }

  async loginAccount(payload: z.infer<typeof loginSchema>) {
    try {
      const res = await this.api.post<IApiResponse<{ token: string }>>(
        `/api/auth/login`,
        payload
      );
      return res.data;
    } catch (error) {
      throw this.structureError(error);
    }
  }

  async requestPasswordReset(payload: z.infer<typeof requestPasswordReset>) {
    try {
      const res = await this.api.post<IApiResponse>(
        `/api/auth/request-password-reset`,
        payload
      );
      return res.data;
    } catch (error) {
      throw this.structureError(error);
    }
  }

  /**
   * ===============================================
   *             USER -AUTH REQUIRED               =
   * ===============================================
   */

  async getCurrentUser() {
    try {
      const res = await this.api.get<IApiResponse<IUser>>(`/api/auth/user/me`);
      return res.data;
    } catch (error) {
      console.log(error);
      return this.structureError<IUser>(error);
    }
  }

  /**
   * ===============================================
   *         USER: TEACHER -AUTH REQUIRED          =
   * ===============================================
   */

  async getOngoingTests() {
    const res = await this.api.get<IApiResponse<IOngoingTest>>(
      `/api/teacher/test/ongoing`
    );

    return res.data;
  }

  async getUnfinishedTests() {
    const q = new URLSearchParams({
      isActive: "false",
      limit: "5",
    });

    const res = await this.api.get<IApiResponse<TestsResponse>>(
      `/api/teacher/test/all/?${q.toString()}`
    );

    return res.data;
  }

  async getTeacherProfile() {
    const res = await this.api.get<IApiResponse<ITeacher>>(
      `/api/teacher/profile`
    );
    return res.data;
  }

  async getRecentTestSubmissions() {
    const res = await this.api.get<IApiResponse<ITestAttempt[]>>(
      `/api/teacher/test/all/recent`
    );

    return res.data;
  }

  async createTest(payload: z.infer<typeof createTestSchema>) {
    const res = await this.api.post<IApiResponse<ITest>>(
      `/api/teacher/test/create`,
      payload
    );

    return res.data;
  }

  async updateTest(testId: string, payload: Partial<ITest>) {
    const res = await this.api.patch<IApiResponse<ITest>>(
      `/api/teacher/test/update/${testId}`,
      payload
    );

    return res.data;
  }

  async findMyStudents() {
    const res = await this.api.get<IApiResponse<IStudent[]>>(
      `/api/teacher/find-students`
    );

    return res.data;
  }

  async addNewStudent(students: string[]) {
    const res = await this.api.patch<IApiResponse<ITeacher>>(
      `/api/teacher/profile/add-students`,
      students
    );

    return res.data;
  }

  async createQuestion(
    testId: string,
    question: Partial<IQuestion>,
    options?: IOption[]
  ) {
    const res = await this.api.post(
      `/api/teacher/test/${testId}/question/create`,
      { ...question, options }
    );

    return res.data;
  }

  async updateQuestion(
    testId: string,
    questionId: string,
    updates: Partial<IQuestion>
  ) {
    const res = await this.api.patch<IApiResponse<IQuestion>>(
      `/api/teacher/test/${testId}/question/${questionId}`,
      updates
    );

    return res.data;
  }

  async deleteQuestion(testId: string, questionId: string) {
    const res = await this.api.delete<IApiResponse>(
      `/api/teacher/test/${testId}/question/${questionId}`
    );
    return res.data;
  }

  async createOption(testId: string, questionId: string, options: IOption[]) {
    const res = await this.api.post<IApiResponse<IOption[]>>(
      `/api/teacher/test/${testId}/question/${questionId}/options`,
      options
    );

    return res.data;
  }

  async updateOption(
    testId: string,
    questionId: string,
    optionId: string,
    updates: Partial<IOption>
  ) {
    const res = await this.api.patch<IApiResponse<IOption>>(
      `/api/teacher/test/${testId}/question/${questionId}/options/${optionId}`,
      updates
    );

    return res.data;
  }

  async deleteOption(testId: string, questionId: string, optionId: string) {
    const res = await this.api.delete<IApiResponse>(
      `/api/teacher/test/${testId}/question/${questionId}/options/${optionId}`
    );

    return res.data;
  }

  async createOrUpdateQuestionAnswer(
    testId: string,
    questionId: string,
    answer: string
  ) {
    const res = await this.api.post<IApiResponse<IAnswer>>(
      `/api/teacher/test/${testId}/question/${questionId}/answer`,
      { answer }
    );

    return res.data;
  }

  async getQuestionAnswer(testId: string, questionId: string) {
    const res = await this.api.get<IApiResponse<IAnswer>>(
      `/api/teacher/test/${testId}/question/${questionId}/answer`
    );
    return res.data;
  }

  /**
   * ===============================================
   *            ALL USERS: AUTH REQUIRED           =
   * ===============================================
   */

  async getTest(testId: string) {
    const res = await this.api.get<IApiResponse<ITest>>(
      `/api/teacher/test/${testId}`
    );

    return res.data;
  }

  async getTestQuestions(
    testId: string,
    options?: { offset?: number; limit?: number },
    type: "teacher" | "student" = "teacher"
  ) {
    const queryParams = new URLSearchParams({
      offset: String(options?.offset || 0),
      limit: String(options?.limit || 10),
    });

    const res = await this.api.get<
      IApiResponse<{ totalQuestions: number; questions: IQuestion[] }>
    >(
      `/api/${type}/test/${testId}/question${
        type === "teacher" ? "" : "s"
      }/all?${queryParams.toString()}`
    );

    return res.data;
  }

  async getTests(options?: {
    limit?: number;
    offset?: number;
    query?: string;
    sort?: "asc" | "desc";
    sortKey?: string;
    isActive?: boolean;
  }) {
    const queryParams = new URLSearchParams({
      limit: String(options?.limit || 10),
      offset: String(options?.offset || 0),
      query: String(options?.query || ""),
      sort: String(options?.sort || "asc"),
      sortKey: String(options?.sortKey || "createdAt"),
      isActive: String(options?.isActive),
    });

    const res = await this.api.get<
      IApiResponse<{
        tests: ITest[];
        filterTestCount: number;
        pagination: Pagination;
      }>
    >(`/api/teacher/test/all?${queryParams?.toString()}`);

    return res.data;
  }

  async getQuestionOptions(testId: string, questionId: string) {
    const res = await this.api.get<IApiResponse<IOption[]>>(
      `/api/test/${testId}/question/${questionId}/options`
    );

    return res.data;
  }
}

export const utils = new Utils();

// ============================================
// FIXED API ROUTE
// ============================================
