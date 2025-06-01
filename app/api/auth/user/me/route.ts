import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IUser } from "@/types/index.types";
import { NextRequest, NextResponse } from "next/server";
import { Document } from "mongoose";
import userSchema from "@/validations/user.schema";
import { UserService } from "@/server/services";

export async function GET(request: NextRequest) {
  try {
    const { res, user } = await isAuthenticated(request);

    if (!res.status) {
      return NextResponse.json({ ...res }, { ...HTTPSTATUS["401"] });
    }

    const userDoc = user as Document<IUser>;
    const { authentication, ...userDetails } = userDoc.toObject();

    return NextResponse.json(
      {
        data: userDetails,
        message: "User details fetched successfully",
        statusCode: 200,
        status: true,
      },
      { ...HTTPSTATUS["200"] }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        message: (error as Error).message,
      },
      { ...HTTPSTATUS["500"] }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const result = userSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          statusCode: 400,
          errors: result.error.errors,
          message: "",
          status: false,
        },
        { ...HTTPSTATUS["400"] }
      );
    }

    const { res, user } = await isAuthenticated(request);

    if (!res.status) {
      return NextResponse.json({ ...res }, { ...HTTPSTATUS["401"] });
    }

    const userService = new UserService(user?.id);

    //If the user has a profile profile to update, this block will run
    if (result?.data?.profilePicture) {
      const { secure_url } = await userService.uploadProfileImage(
        result.data.profilePicture
      );

      result.data = {
        ...result.data,
        profilePicture: secure_url,
      };
    }

    const updatedUser = await userService.updateDetail(user?.id, result.data);

    return NextResponse.json(
      {
        statusCode: 200,
        status: true,
        message: "User details has been updated successfully",
        data: updatedUser,
      },
      { ...HTTPSTATUS["200"] }
    );
  } catch (error) {
    return NextResponse.json(
      { status: false, statusCode: 500, message: (error as Error).message },
      { ...HTTPSTATUS["500"] }
    );
  }
}
