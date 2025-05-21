import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { TeacherService } from "@/server/services";
import { Test } from "@/server/test.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const test = await testService.getTest({
      query: { _id: id, teacher: teacher?._id },
      throwOn404: true,
      addTeacher: true,
    });

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Test created successfully",
        data: test,
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
