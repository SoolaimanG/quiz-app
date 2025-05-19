import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { TeacherService } from "@/server/services";
import { subjectCreationSchemaWithId } from "@/validations/subject-creation.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = subjectCreationSchemaWithId.safeParse(body);

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

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const subjectIds = result.data;

    const teacherService = new TeacherService(user?.identifier);

    const updatedTeacherProfile = await teacherService.addNewSubjects(
      subjectIds
    );

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        data: updatedTeacherProfile,
        message: "New subject(s) has been added to your profile",
      },
      HTTPSTATUS["200"]
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        message: (error as Error).message,
      },
      HTTPSTATUS["500"]
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const teacherService = new TeacherService(user?.identifier);

    const availableSubjects = await teacherService.getAvailableSubjectsForMe();

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Available subjects fetched successfully",
        data: availableSubjects,
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
