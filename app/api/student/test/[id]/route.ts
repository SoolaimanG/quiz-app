import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { TeacherService } from "@/server/services";
import { Student } from "@/server/student.service";
import { Test } from "@/server/test.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { res, user } = await isAuthenticated(request, IRole.STUDENT);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier);

    const studentService = new Student(user?.identifier);

    const student = await studentService.getStudentProfile({
      throwOn404: true,
      toJson: true,
    });

    const test = await testService.getTest({
      query: { _id: id, allowedStudents: { $in: student?._id } },
      throwOn404: true,
      select: "-allowedStudents",
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
