import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Student } from "@/server/student.service";
import { updateStudentSchema } from "@/validations/student.schema";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const cookiesStore = await cookies();

    const result = updateStudentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { status: false, statusCode: 400, errors: result.error.errors },
        HTTPSTATUS["400"]
      );
    }

    const { res, user } = await isAuthenticated(request, IRole.STUDENT);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const studentService = new Student(user?.identifier);

    const student = await studentService?.getStudentProfile({
      query: { user: user?._id },
      throwOn404: true,
    });

    const updatedStudent = await studentService?.updateStudentProfile(
      student?._id as string,
      result.data
    );

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
        message: "Your profile has been updated successfully",
        data: updatedStudent,
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
