import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { attemptQuestionSchema } from "@/validations/test.schema";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const cookiesStore = await cookies();

    const result = attemptQuestionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          errors: result.error.errors,
          message: result.error.message,
        },
        HTTPSTATUS["400"]
      );
    }

    const { user, res } = await isAuthenticated(request, IRole.STUDENT);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier, id);

    const response = await testService.attemptQuestion(
      result.data.question,
      result.data.answer
    );

    const auth = await user?.refreshSessionToken?.();

    if (auth.sessionToken) {
      cookiesStore.set(
        _CONSTANTS.AUTH_HEADER,
        auth?.sessionToken,
        COOKIES_OPTION
      );
      cookiesStore.set("user_session", "true", COOKIES_OPTION);
    }

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Question Attempted successfully",
        data: response,
      },
      HTTPSTATUS["200"]
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 500,
        statusCode: 500,
        message: (error as Error).message,
      },
      HTTPSTATUS["500"]
    );
  }
}
