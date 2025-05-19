import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Subject } from "@/server/services";
import {
  subjectCreationSchema,
  subjectCreationSchemaWithId,
} from "@/validations/subject-creation.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = subjectCreationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "",
          status: false,
          statusCode: 400,
          errors: result.error.errors,
        },
        { ...HTTPSTATUS["400"] }
      );
    }

    const { res, user } = await isAuthenticated(request, IRole.ADMIN);

    if (!res.status) {
      return NextResponse.json(res, { ...HTTPSTATUS["401"] });
    }

    const subjectService = new Subject(user?.id);

    const subject = await subjectService.createSubject(result.data);

    return NextResponse.json(
      {
        statusCode: 200,
        status: true,
        message: "Subject has been created successfully",
        data: subject,
      },
      { ...HTTPSTATUS["200"] }
    );
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message, status: false, statusCode: 500 },
      { ...HTTPSTATUS["500"] }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams;

    const ids = q.get("ids")?.split("-");

    const result = subjectCreationSchemaWithId.safeParse(ids);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 500,
          message: "",
          errors: result.error.errors,
        },
        HTTPSTATUS["400"]
      );
    }

    const { user, res } = await isAuthenticated(request, IRole.ADMIN);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const subjectService = new Subject(user?.id);

    await subjectService.deleteSubjects(result.data);

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Subject(s) deleted successfully",
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

export async function GET(request: NextRequest) {
  try {
    const { res } = await isAuthenticated(request, IRole.ADMIN);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const subjectService = new Subject();

    const subjects = await subjectService.getSubjects();

    return NextResponse.json(
      { status: true, statusCode: 200, data: subjects },
      HTTPSTATUS["200"]
    );
  } catch (error) {
    return NextResponse.json(
      { status: false, statusCode: 500, message: (error as Error).message },
      HTTPSTATUS["500"]
    );
  }
}
