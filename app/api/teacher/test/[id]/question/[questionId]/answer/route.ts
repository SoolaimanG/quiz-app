import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { questionAnswerSchema } from "@/validations/test.schema";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id, questionId } = await params;

    const body = await request.json();
    const cookiesStore = await cookies();

    const result = questionAnswerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          message: result.error.message,
          errors: result.error.issues,
        },
        HTTPSTATUS["400"]
      );
    }

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier, id);

    const answer = await testService.addAnswerForQuestion(
      questionId,
      result.data.answer!
    );

    const auth = await user?.refreshSessionToken?.();

    if (auth?.sessionToken) {
      cookiesStore.set(
        _CONSTANTS.AUTH_HEADER,
        auth?.sessionToken,
        COOKIES_OPTION
      );
      cookiesStore.set("user_session", "true", COOKIES_OPTION);

      await user?.save({ validateModifiedOnly: true });
    }

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Question answer added successfully",
        data: answer,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id, questionId } = await params;

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier, id);

    const answer = await testService.getQuestionAnswer(questionId);

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Question answer fetched successfully",
        data: answer,
      },
      HTTPSTATUS["200"]
    );
  } catch (error) {
    console.log(error);
    // TODO: Log the error t
    return NextResponse.json(
      { status: false, statusCode: 500, message: (error as Error).message },
      HTTPSTATUS["500"]
    );
  }
}
