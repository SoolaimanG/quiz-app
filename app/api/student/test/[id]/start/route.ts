import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { startTestSchema } from "@/validations/test.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const result = startTestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          errors: result.error.errors,
          message: result.error.message,
        },
        HTTPSTATUS["400"]
      );
    }

    const { user, res } = await isAuthenticated(request, IRole.STUDENT);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier, id);

    const response = await testService.startTest({
      accessCode: result.data?.accessCode!,
    });

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Test started successfully",
        data: response,
      },
      HTTPSTATUS["200"]
    );
  } catch (error) {
    const err = error as Error;

    const [code = "500", message, data] = err.message.split(":");

    if (code === "403") {
      return NextResponse.json(
        { status: false, statusCode: 403, message: message?.trim(), data },
        HTTPSTATUS["403"]
      );
    }

    return NextResponse.json(
      {
        status: 500,
        statusCode: 500,
        message: (error as Error).message,
      },
      HTTPSTATUS["500"]
    );
  }
}
