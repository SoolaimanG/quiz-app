import { ITestimonial } from "@/types/client.types";
import { IRole } from "@/types/index.types";
import { BookOpenIcon, ChartNoAxesColumn, GraduationCap } from "lucide-react";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

enum _CONSTANTS {
  AUTH_HEADER = "X-QUIZ-APP-SESSION-TOKEN",
}

const HTTPSTATUS = {
  "200": {
    status: 200,
    statusText: "SUCCESS",
  },
  "201": {
    status: 201,
    statusText: "RESOURCES CREATED",
  },
  "400": {
    status: 400,
    statusText: "BAD REQUEST",
  },
  "401": {
    status: 401,
    statusText: "UNAUTHORIZED",
  },
  "403": {
    status: 403,
    statusText: "FORBIDDEN",
  },
  "404": {
    status: 404,
    statusText: "NOT FOUND",
  },
  "500": {
    status: 500,
    statusText: "INTERNAL SERVER ERROR",
  },
  "502": {
    status: 502,
    statusText: "BAD GATEWAY",
  },
  "503": {
    status: 503,
    statusText: "SERVICE UNAVAILABLE",
  },
};

const COOKIES_OPTION: Partial<ResponseCookie> = {
  maxAge: 60 * 60,
  httpOnly: false, // Added for security
  path: "/", // Added to make cookie available site-wide
  sameSite: "strict", // More specific than just 'true'
  secure: false,
  domain: "localhost",
};

enum FONT_STYLES {
  IBM_THIN = "ibm-plex-mono-thin",
  IBM_EXTRA_LIGHT = "ibm-plex-mono-extralight",
  IBM_LIGHT = "ibm-plex-mono-light",
  IBM_MEDIUM = "ibm-plex-mono-medium",
  IBM_THIN_ITALIC = "ibm-plex-mono-thin-italic",
  IBM_EXTRA_LIGHT_ITALIC = "ibm-plex-mono-extralight-italic",
  IBM_LIGHT_ITALIC = "ibm-plex-mono-light-italic",
  IBM_MEDIUM_ITALIC = "ibm-plex-mono-medium-italic",
  IBM_REGULAR_ITALIC = "ibm-plex-mono-regular-italic",
  IBM_SEMI_BOLD_ITALIC = "ibm-plex-mono-semibold-italic",
  IBM_BOLC_ITALIC = "ibm-plex-mono-bold-italic",
}

enum LINKS {
  HOME = "/",
  SIGNIN = "/auth/sign-in/",
  SIGNUP = "/auth/sign-up/",
  FORGET_PASSWORD = "/auth/forget-password/",

  //STUDENT-ROUTES
  STUDENT_DASHBOARD = "/student/dashboard/",
  STUDENT_TEST = "/student/test/",

  //TEACHER-ROUTE
  TEACHER_DASHBOARD = "/teacher/dashboard/",
  TEACHER_SEARCH = "/teacher/search/",
  TEACHER_INSIGHTS = "/teacher/insight/",
  TEACHER_TESTS = "/teacher/tests/",
  TEACHER_STUDENTS = "/teacher/students/",
  TEACHER_SUBJECT = "/teacher/subjects/",
}

const TESTIMONIALS: ITestimonial[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "STUDENT",
    content:
      "This quiz platform has completely transformed how I prepare for my exams. The interactive format and instant feedback have helped me identify my weak areas and improve significantly.",
    profilePicture: "/testimonials/profilePicture1.jpg",
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    role: "TEACHER",
    content:
      "As an educator, I find this platform invaluable for creating engaging assessments. The analytics help me understand student performance patterns and adjust my teaching accordingly.",
    profilePicture: "/testimonials/profilePicture2.jpg",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "STUDENT",
    content:
      "The flexibility of taking quizzes at my own pace has been a game-changer. The platform is user-friendly and the variety of question formats keeps me engaged.",
    profilePicture: "/testimonials/profilePicture3.jpg",
  },
  {
    id: "4",
    name: "James Wilson",
    role: "TEACHER",
    content:
      "We've implemented this platform for our company's training assessments. The customization options and detailed reporting features have streamlined our evaluation process.",
    profilePicture: "/testimonials/profilePicture4.jpg",
  },
  {
    id: "5",
    name: "Lisa Thompson",
    role: "TEACHER",
    content:
      "My students have shown remarkable improvement since we started using this quiz platform. The practice tests are well-designed and closely mirror actual exam conditions.",
    profilePicture: "/testimonials/profilePicture5.jpg",
  },
] as const;

const ACCOUNT_TYPES: IRole[] = ["STUDENT", "TEACHER"] as const; //TODO: Add account type

const TEACHER_SEARCH = [
  {
    id: "1",
    icon: GraduationCap,
    title: "My Students",
    description:
      "View and manage all students enrolled in the courses you teach. Track their progress, attendance, and performance.",
    path: "students",
  },
  {
    id: "2",
    icon: ChartNoAxesColumn,
    title: "Test Results & Analytics",
    description:
      "Access comprehensive test results, grades, and performance analytics for all your students and courses.",
    path: "results",
  },
  {
    id: "3",
    icon: BookOpenIcon,
    title: "Subject Management",
    description:
      "Organize and manage all subjects you teach. Create, edit, and structure your curriculum content.",
    path: "subjects",
  },
];

export {
  _CONSTANTS,
  HTTPSTATUS,
  COOKIES_OPTION,
  FONT_STYLES,
  LINKS,
  TESTIMONIALS,
  ACCOUNT_TYPES,
  TEACHER_SEARCH,
};
