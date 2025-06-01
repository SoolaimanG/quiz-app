import { HTMLMotionProps } from "framer-motion";
import { Schema } from "mongoose";
import { ZodIssue } from "zod";

export interface ITimeStamp {
  createdAt?: string;
  updatedAt?: string;
}

export type IRole = "TEACHER" | "STUDENT" | "ADMIN";
export type IGender = "MALE" | "FEMALE";
export type ITestStatus = "completed" | "in-progress" | "not-started";
export type IQuestionType =
  | "mcq"
  | "short-answer"
  | "long-answer"
  | "obj"
  | "boolean";
export type IMediaType = "image";
export type ILogSeverity = "info" | "warning" | "error" | "critical";

export interface IUser extends ITimeStamp {
  _id?: string;
  identifier: string;
  email: string;
  name: string;
  authentication: {
    password: string;
    salt?: string;
    sessionToken?: string;
    expiresAt?: Date;
  };
  isActive?: boolean;
  role: IRole;
  lastLogin: string;
  gender: IGender;
  profilePicture?: string;
  isSubjectsApproved?: boolean;
  pendingSubjects?: (string | ISubject)[];

  //Auth Methods
  validatePassword?: (password: string) => Promise<void>;
  setPassword?: (password: string) => void;
  generateSalt?: () => string;
  generateToken?: () => string;
  setSession?: (token: string, salt: string, expiresAt: Date) => void;
  clearSession?: () => void;
  isSessionExpired?: () => boolean;
  refreshSessionToken?: <T = any>() => Promise<T>;
  validateUser?: (role: IRole) => Promise<void>;

  //Helpers
  updateProfilePicture?: (url: string) => void;
  updateLastLogin?: () => void;
  updatePassword?: (password: string) => void;
  updateEmail?: (email: string) => void;
  updateName?: (name: string) => void;

  //Static methods
  findByEmail?: (email: string) => Promise<IUser>;
  findById?: (id: string) => Promise<IUser>;
  findBySessionToken?: (sessionToken: string) => Promise<IUser>;
  findByIdentifier?: (email: string, identifier: string) => Promise<IUser>;
}

export interface ITeacher {
  _id?: string;
  subjects?: (ISubject | string)[];
  students?: (IStudent | string)[];
  canGradeTest?: boolean;
  canCreateTest?: boolean;
  user: IUser | string;

  //Methods
  addStudent?: (studentId: IStudent | string) => void;
  addStudents?: (studentIds: (IStudent | string)[]) => void;
  removeStudent?: (studentId: IStudent | string) => void;
  addSubjects?: (subjectIds: string[]) => Promise<void>;
  removeSubject?: (subjectId: string) => void;
  findByUserId?: (userId: string) => Promise<ITeacher>;
}

export interface IStudent {
  _id?: string;
  dob?: string | Date;
  contact?: string;
  tests?: (ITestAttempt | string)[];
  user: IUser | string;
  subjects?: (ISubject | string)[];
  endDate?: Date; //Date when the student is expected to finish school

  //Methods
  findByUserId?: (userId: string) => Promise<IStudent>;
}

export interface ISubject extends ITimeStamp {
  _id?: string;
  name: string;
  description?: string;
  teachers: (ITeacher | string)[];

  //Static methods
  getAll: () => Promise<ISubject[]>;
  getSubjectById: (subjectId: string) => Promise<IStudent>;
  getSubjectByName: (subjectName: string) => Promise<IStudent>;
}

export interface IAdmin extends IUser {}

export interface ILogs extends ITimeStamp {
  _id?: string;
  user: IUser | string;
  log: string;
  severity?: ILogSeverity;
  userAgent?: string;
  action?: string;
}

export interface ITest extends ITimeStamp {
  _id?: string;
  title: string;
  instructions: string;
  description: string;
  teacher: ITeacher | string;
  settings?: ITestSettings;
  allowedStudents: (IStudent | string)[];
  accessCode?: ITestAccessCode;
  subject: ISubject | string;
  isActive?: boolean;
  secretKey?: string;
}

export interface ITestAccessCode extends ITimeStamp {
  code: string;
  usageCount: number;
  allowReuse?: boolean;
  maxUsageCount?: number;
  validUntil?: Date;
  students: (IStudent | string)[];
}

export interface ITestSettings {
  _id?: string;
  timeLimit?: number;
  endNote?: string;
  submitOnPageLeave?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showCorrectAnswers?: boolean;
  showRemainingTime?: boolean;
  showProgress?: boolean;
  showNavigation?: boolean;
  showSubmitButton?: boolean;
  showResultAtEnd?: boolean;
  screenRecordSession?: boolean;
  lockDownBrowser?: boolean;
  preventScreenCapture?: boolean;
  preventCopyPaste?: boolean;
  preventPrint?: boolean;
  allowInternalSystemToGradeTest?: boolean;
}

export interface IQuestionsAttempted {
  _id?: string;
  question: IQuestion | string;
  answer: string;
  isCorrect: boolean;
}

export interface ITestAttempt extends ITimeStamp {
  _id?: string | Schema.Types.ObjectId;
  test: ITest | string;
  student: IStudent | string;
  score: number;
  startTime: Date;
  endTime?: Date;
  status: ITestStatus;
  teacherFeedback?: string;
  questionsAttempted: IQuestionsAttempted[];
  studentLogs: ILogs[];
  resultIsReady?: boolean;
}

export interface IMedia extends ITimeStamp {
  _id?: string;
  url: string;
  type: IMediaType;
  publicId?: string;
}

export interface IQuestion extends ITimeStamp {
  _id?: string;
  test: ITest | string;
  question: string;
  type: IQuestionType;
  hint?: string;
  score: number;
  explanation?: string;
  media?: IMedia | string;
  booleanAnswer?: boolean;
}

export interface IOption extends ITimeStamp {
  _id?: string;
  question: IQuestion | string;
  option: string;
  isCorrect: boolean;
  media?: IMedia | string;
}

export interface IAnswer extends ITimeStamp {
  _id?: string;
  answer: string;
  question: IQuestion | string;
}

export interface ITestSummary {
  _id: string;
  title: string;
  subject: string;
  totalAllowedStudents: number;
  totalSubmitted: number;
  submissionRate: string;
}

export interface IOngoingTest {
  totalOngoingTests: number;
  totalSubmissionsAcrossAllTests: number;
  totalAllowedStudentsAcrossAllTests: number;
  overallSubmissionRate: string;
  tests: ITestSummary[];
}

//Api Response
export interface IApiResponse<T = any> {
  data: T;
  status: boolean;
  message: string;
  statusCode: number;
  errors?: ZodIssue[];
  [key: string]: any;
}

export interface ITestAttemptInfo {
  id: string;
  startTime: string;
  endTime: string;
  status: ITestStatus;
  totalTimeTaken: number;
  resultIsReady: boolean;
}

export interface IOverallPerformance {
  score: number;
  totalPossibleScore: number;
  scorePercentage: number;
  grade: string;
  performance: string;
  accuracy: number;
  completionRate: number;
  totalQuestionsAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattemptedQuestions: number;
}

export interface IQuestionAnalysis {
  questionId: string;
  question: string;
  type: IQuestionType;
  maxScore: number;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  scoreEarned: number;
  isAttempted: boolean;
  options: any[] | null;
}

export interface ITypePerformanceMetrics {
  totalQuestions: number;
  correctAnswers: number;
  totalScore: number;
  earnedScore: number;
  accuracy: number;
}

export interface ITypePerformance {
  [key: string]: ITypePerformanceMetrics;
}

export interface IInsights {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface ITestAnalysisData {
  attemptInfo: ITestAttemptInfo;
  overallPerformance: IOverallPerformance;
  questionAnalysis: IQuestionAnalysis[];
  typePerformance: ITypePerformance;
  insights: IInsights;
  teacherFeedback: string | null;
  studentLogs: ILogs[];
  generatedAt: string;
}

export interface UploadDocsOptions {
  skipDocOnError?: boolean;
  throwOnError?: boolean;
  isProfileImage?: boolean;
}

//EXTERNALS
export interface DecryptedTextProps extends HTMLMotionProps<"span"> {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  parentClassName?: string;
  animateOn?: "view" | "hover";
}
