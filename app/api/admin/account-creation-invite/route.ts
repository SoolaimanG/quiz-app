import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { connectToDatabase } from "@/server/_libs";
import { AccountInvitation } from "@/server/services";
import { IAccountCreationInvite } from "@/types/invites.types";
import accountCreationInvitationSchema from "@/validations/account-invitation.schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { res, user } = await isAuthenticated(request);

    if (!res.status) {
      return NextResponse.json({ ...res }, { ...HTTPSTATUS[401] });
    }

    const body = await request.json();

    const result = accountCreationInvitationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          errors: result.error.errors,
          message: "Invalid request body",
        },
        { ...HTTPSTATUS["400"] }
      );
    }

    const supposeInvitations =
      result.data as unknown as IAccountCreationInvite[];

    await connectToDatabase();

    const invite = new AccountInvitation(user?.identifier);

    const invitations = await invite.createInvitations<
      IAccountCreationInvite[]
    >(supposeInvitations);

    return NextResponse.json(
      {
        status: true,
        data: invitations,
        message: "Invitations sent successfully to the emails provided",
        statusCode: 201,
      },
      { ...HTTPSTATUS["201"] }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { status: false, message: (error as Error).message, statusCode: 500 },
      { ...HTTPSTATUS["500"] }
    );
  }
}
