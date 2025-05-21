import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookiesStore = await cookies();

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier, id);

    const newTest = await testService.stopOrContinueTest();

    const auth = await user?.refreshSessionToken?.();

    if (auth) {
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
        message: newTest?.isActive
          ? "Test has been enable"
          : "Test has been disable",
        data: { isActive: newTest.isActive },
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
