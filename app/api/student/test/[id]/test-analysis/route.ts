import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const q = request.nextUrl.searchParams;
    const studentId = q.get("studentId")!;

    const { res, user } = await isAuthenticated(request);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier, id);

    if (user?.role === IRole.TEACHER) {
      if (!studentId) {
        return NextResponse.json(
          {
            status: false,
            statusCode: 400,
            message: "Missing student id",
          },
          HTTPSTATUS["400"]
        );
      }

      const teacher = await testService.teacher?.getTeacherProfile({
        throwOn404: true,
      });

      await testService.getTest({
        query: {
          teacher: teacher?._id,
        },
        throwOn404: true,
      });
    }

    const result = await testService.getStudentAnalysisOnTest(
      studentId,
      user?.role
    );

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Analysis on generated successfully",
        data: result,
      },
      HTTPSTATUS["200"]
    );
  } catch (error) {
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
