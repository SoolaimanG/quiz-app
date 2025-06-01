import { HTTPSTATUS } from "@/lib/constants";
import { Test } from "@/server/test.service";
import { gradeTestSchema } from "@/validations/test.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const result = gradeTestSchema.safeParse(body);

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

    const testService = new Test(undefined, id);

    await testService.testGrader(result.data.studentId, result.data.secretKey);

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message:
          "Test has been graded using the internal systems, Please have a look and make sure there are no errors",
      },
      HTTPSTATUS["200"]
    );
  } catch (error) {
    const err = error as Error;

    return NextResponse.json(
      {
        status: 500,
        statusCode: 500,
        message: err.message,
      },
      HTTPSTATUS["500"]
    );
  }
}
