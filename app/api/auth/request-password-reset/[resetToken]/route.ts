import { HTTPSTATUS } from "@/lib/constants";
import { connectToDatabase } from "@/server/_libs";
import { UserService } from "@/server/services";
import {
  requestPasswordReset,
  resetPassword,
} from "@/validations/forget-password.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resetToken: string }> }
) {
  try {
    const body = await request.json();
    const { resetToken } = await params;

    const result = resetPassword.safeParse(body);

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

    const message = await userService.resetPassword(
      resetToken,
      result.data.newPassword
    );

    return NextResponse.json(
      {
        status: true,
        statusCode: 200,
        message,
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
