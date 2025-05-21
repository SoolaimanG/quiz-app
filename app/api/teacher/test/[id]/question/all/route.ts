import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const q = request.nextUrl.searchParams;

    const { id } = await params;
    const limit = Number(q.get("limit")) || 10;
    const offset = Number(q.get("offset")) || 0;

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier, id);

    const questions = await testService.getTestQuestions(IRole.TEACHER, {
      limit,
      offset,
    });

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Successfully fetched questions",
        data: questions,
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
