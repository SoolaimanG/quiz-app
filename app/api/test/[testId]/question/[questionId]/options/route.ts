import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { Test } from "@/server/test.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string; questionId: string }> }
) {
  try {
    const { testId, questionId } = await params;

    const { res, user } = await isAuthenticated(request);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const test = new Test(user?.identifier, testId);

    const options = await test.getOptions(questionId, user?.role!);

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Options fetched successfully",
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
