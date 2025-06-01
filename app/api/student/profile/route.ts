import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Student } from "@/server/student.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { res, user } = await isAuthenticated(request, IRole.STUDENT);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const studentService = new Student(user?.identifier);

    const student = await studentService?.getStudentProfile();

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Your profile has been fetched successfully",
        data: student,
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
