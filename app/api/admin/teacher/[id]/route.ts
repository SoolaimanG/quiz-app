import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { TeacherService } from "@/server/services";
import { teacherUpdatesSchema } from "@/validations/teacher.schema";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    const result = teacherUpdatesSchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          errors: result.error.errors,
          message: "",
        },
        HTTPSTATUS["400"]
      );
    }

    const { res, user } = await isAuthenticated(request, IRole.ADMIN);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const teacherService = new TeacherService(user?.identifier);

    const teacherProfile = await teacherService.getTeacherProfile({
      query: { user: result.data.id },
      toJson: true,
      throwOn404: true,
    });

    const teacher = await teacherService.updateTeacher(
      teacherProfile?._id!,
      result.data
    );

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Teacher profile updated successfully",
        data: teacher,
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
