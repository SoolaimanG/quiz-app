import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { Test } from "@/server/test.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { res, user } = await isAuthenticated(request, IRole.TEACHER);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier);

    const ongoingTests = await testService.getOngoingTests();

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message: "Ongoing tests fetched successfully",
        data: ongoingTests,
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
