import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { isValidObjectId } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams;
    const limit = Number(q.get("limit")) || 10;
    const offset = Number(q.get("offset")) || 0;
    const query = q.get("query")!;
    const sortKey = q.get("sortKey")!;
    const sort = q.get("sort")! as "asc" | "desc";
    const studentId = q.get("studentId")!;

    const { res, user } = await isAuthenticated(request);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier);

    if (user?.role === IRole.TEACHER && !isValidObjectId(studentId)) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 404,
          message: "Missing required parameter (Student Id)",
        },
        HTTPSTATUS["404"]
      );
    }

    const testAttempts = await testService.getTestAttempts({
      limit,
      offset,
      sortKey,
      studentId,
      query,
      sort,
    });

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Successfully fetched questions",
        data: testAttempts,
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
