import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { IOption } from "@/types/index.types";
import { optionCreationSchema } from "@/validations/question.schema";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string; id: string }> }
) {
  try {
    const { id: testId, questionId } = await params;

    const body = await request.json();
    const cookiesStore = await cookies();

    const result = optionCreationSchema.safeParse(body);

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

    const testService = new Test(user?.identifier, testId);

    const options = await testService.createOptionForQuestion(
      questionId,
      result.data as IOption[]
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
        statusCode: 200,
        message: "Option(s) created successfully",
        data: options,
      },
      HTTPSTATUS["200"]
    );
  } catch (error) {
    return NextResponse.json(
      { status: false, statusCode: 500, message: (error as Error).message },
      HTTPSTATUS["500"]
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string; id: string }> }
) {
  try {
    const q = request.nextUrl.searchParams;

    const optionIds = q.get("ids")?.split(",") || [];

    const { id: testId, questionId } = await params;

    const cookiesStore = await cookies();

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier, testId);

    await testService.removeOptions(questionId, optionIds);

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
        statusCode: 200,
        message: "Option(s) deleted successfully",
      },
      HTTPSTATUS["200"]
    );
  } catch (error) {
    return NextResponse.json(
      { status: false, statusCode: 500, message: (error as Error).message },
      HTTPSTATUS["500"]
    );
  }
}
