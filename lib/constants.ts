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
  httpOnly: true, // Added for security
  path: "/", // Added to make cookie available site-wide
  sameSite: "strict", // More specific than just 'true'
  secure: true,
};

export { _CONSTANTS, HTTPSTATUS, COOKIES_OPTION };
