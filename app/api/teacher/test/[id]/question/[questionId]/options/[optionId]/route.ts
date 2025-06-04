import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { updateOptionSchema } from "@/validations/question.schema";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ questionId: string; id: string; optionId: string }> }
) {
  try {
    const { id: testId, questionId, optionId } = await params;

    const body = await request.json();
    const cookiesStore = await cookies();

    const result = updateOptionSchema.safeParse(body);

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

    const option = await testService.updateOptionForQuestion(
      questionId,
      optionId,
      result.data
    );

    const auth = await user?.refreshSessionToken?.();

    if (auth?.sessionToken) {
      cookiesStore.set(
        _CONSTANTS.AUTH_HEADER,
        auth.sessionToken,
        COOKIES_OPTION
      );
      cookiesStore.set("user_session", "true", COOKIES_OPTION);

      await user?.save({ validateModifiedOnly: true });
    }

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: `Option ${optionId} updated successfully`,
        data: option,
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
  {
    params,
  }: { params: Promise<{ questionId: string; id: string; optionId: string }> }
) {
  try {
    const { id: testId, questionId, optionId } = await params;

    const cookiesStore = await cookies();

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier, testId);

    const isDeleted = await testService.deleteOptionForQuestion(
      questionId,
      optionId
    );

    if (!isDeleted) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 500,
          message: `Something went wrong`,
        },
        HTTPSTATUS["500"]
      );
    }

    const auth = await user?.refreshSessionToken?.();

    if (auth?.sessionToken) {
      cookiesStore.set(
        _CONSTANTS.AUTH_HEADER,
        auth.sessionToken,
        COOKIES_OPTION
      );
      cookiesStore.set("user_session", "true", COOKIES_OPTION);

      await user?.save({ validateModifiedOnly: true });
    }

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: `Option ${optionId} deleted successfully`,
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
