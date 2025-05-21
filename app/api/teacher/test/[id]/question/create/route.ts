import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { questionCreationSchema } from "@/validations/question.schema";
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

    const result = questionCreationSchema.safeParse(body);

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

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier, id);

    const newQuestion = await testService.createQuestion({
      ...result.data,
      test: "",
    });

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
        statusCode: 201,
        data: newQuestion,
      },
      HTTPSTATUS["201"]
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        message: (error as Error).message,
      },
      HTTPSTATUS["500"]
    );
  }
}
