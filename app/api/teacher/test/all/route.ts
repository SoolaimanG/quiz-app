import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { TeacherService } from "@/server/services";
import { Test } from "@/server/test.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams;

    const limit = Number(q.get("limit") || 10);
    const offset = Number(q.get("offset"));
    const query = q.get("query")!;
    const sort = q.get("sort") as "asc" | "desc";
    const sortKey = q.get("sortKey")!;
    const isActive = q.get("isActive")!;

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier);

    const teacherService = new TeacherService(user?.identifier);

    const teacher = await teacherService.getTeacherProfile({
      throwOn404: true,
      toJson: true,
    });

    const tests = await testService.getTests({
      teacher: teacher?._id,
      limit,
      offset,
      query,
      sort,
      sortKey,
      isActive,
    });

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Test(s) fetched successfully",
        data: tests,
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
