import { HTTPSTATUS } from "@/lib/constants";
import { Test } from "@/server/test.service";
import { isValidObjectId } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const { studentId, testAttemptId } = body;

    if (!isValidObjectId(studentId)) throw new Error("Invalid student id");

    if (!isValidObjectId(testAttemptId))
      throw new Error("Invalid test attempt id");

    const testService = new Test(undefined, id);

    await testService.submitTest(studentId, testAttemptId);

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Test submitted successfully",
      },
      HTTPSTATUS["200"]
    );
  } catch (error) {
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
