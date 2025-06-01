import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { Test } from "@/server/test.service";
import { createTestSchema } from "@/validations/test.schema";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookiesStore = await cookies();

    const result = createTestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          message: "",
          errors: result.error.errors,
        },
        HTTPSTATUS["400"]
      );
    }

    const { res, user } = await isAuthenticated(request);

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const testService = new Test(user?.identifier);

    if (result.data.media) {
      const uploadResult = await testService.uploadImage(
        [result.data.media.url],
        "image"
      );

      if (uploadResult?.[0].secure_url) {
        result.data = {
          ...result.data,
          media: {
            publicId: uploadResult[0].public_id,
            url: uploadResult[0].secure_url,
            type: "image",
          },
        };
      }
    }

    const newTest = await testService.createTest(result.data);

    const auth = await user?.refreshSessionToken?.();

    if (auth) {
      cookiesStore.set(
        _CONSTANTS.AUTH_HEADER,
        auth?.sessionToken,
        COOKIES_OPTION
      );
      cookiesStore.set("user_session", "true", COOKIES_OPTION);

      await user?.save({ validateModifiedOnly: true });
    }

    return NextResponse.json(
      {
        status: true,
        statusCode: 201,
        message: "Test created successfully",
        data: newTest,
      },
      HTTPSTATUS["201"]
    );
  } catch (error) {
    return NextResponse.json(
      { status: false, statusCode: 500, message: (error as Error).message },
      HTTPSTATUS["500"]
    );
  }
}
