import { HTTPSTATUS } from "@/lib/constants";
import { connectToDatabase } from "@/server/_libs";
import { UserService } from "@/server/services";
import { requestPasswordReset } from "@/validations/forget-password.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = requestPasswordReset.safeParse(body);

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

    await connectToDatabase();

    const userService = new UserService();

    await userService.requestResetPassword(result.data.identifier);

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message:
          "An email has been sent to your email address containing information to reset your password",
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
