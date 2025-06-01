import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { TeacherService } from "@/server/services";
import { teacherUpdatesSchemaForTeacher } from "@/validations/teacher.schema";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const result = teacherUpdatesSchemaForTeacher.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          message: result?.error?.message,
          errors: result.error?.errors,
        },
        HTTPSTATUS["400"]
      );
    }

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const teacherService = new TeacherService(user?.identifier);

    const teacher = await teacherService.getTeacherProfile();

    const updatedProfile = await teacherService.updateTeacher(teacher?._id!, {
      students: result.data,
    });

    return NextResponse.json(
      {
        status: false,
        statusCode: 200,
        message: "Profile updated successfully",
        data: updatedProfile,
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
