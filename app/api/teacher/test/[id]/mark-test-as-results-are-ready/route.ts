import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { markTestAsResultsAreReadySchema } from "@/validations/test.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();

    const { id } = await params;

    const result = markTestAsResultsAreReadySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          message: result.error.message,
          errors: result.error.errors,
          statusCode: 400,
        },
        HTTPSTATUS["400"]
      );
    }

    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const test = new Test(user?.identifier, id);

    await test.markTestAsResultsAreReady(
      result.data.studentIds!,
      result.data.notifyViaEmail,
      result.data.allStudent
    );

    return NextResponse.json(
      {
        status: true,
        message: "Results are now ready for the student(s) listed.",
        statusCode: 200,
      },
      HTTPSTATUS["200"]
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: false,
        message: (error as Error).message,
        statusCode: 500,
      },
      HTTPSTATUS["500"]
    );
  }
}
