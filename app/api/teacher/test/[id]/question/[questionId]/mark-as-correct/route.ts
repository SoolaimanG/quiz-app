import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { markQuestionAsCorrectSchema } from "@/validations/test.schema";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const body = await request.json();
    const cookiesStore = await cookies();

    const { id, questionId } = await params;

    const result = markQuestionAsCorrectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          message: result.error.message,
          errors: result.error.errors,
          statusCode: 400,
        },
        HTTPSTATUS["400"]
      );
    }

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const test = new Test(user?.identifier, id);

    const attempt = await test.markQuestionAsCorrect(
      questionId,
      result.data.testAttemptId
    );

    const auth = await user?.refreshSessionToken?.();

    if (auth?.sessionToken) {
      cookiesStore.set(
        _CONSTANTS.AUTH_HEADER,
        auth.sessionToken,
        COOKIES_OPTION
      );
      cookiesStore.set("user_session", "true", COOKIES_OPTION);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Question marked as correct",
        data: attempt,
        statusCode: 200,
      },
      HTTPSTATUS["200"]
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: false,
        message: (error as Error).message,
        statusCode: 500,
      },
      HTTPSTATUS["500"]
    );
  }
}
