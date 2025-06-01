import DecryptedText from "@/components/decrypted-text";
import { Text } from "@/components/text";
import { Button } from "@/components/ui/button";
import { LINKS } from "@/lib/constants";
import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="w-screen md:max-w-3xl mx-auto h-screen flex items-start justify-center flex-col p-6">
      <h2>STATUS 403 -------------</h2>
      <div>
        <DecryptedText
          text="FORBIDDEN"
          speed={100}
          maxIterations={20}
          characters="ABCD1234!?"
          parentClassName="all-letters"
          encryptedClassName="encrypted text-[5rem]"
          animateOn="view"
          className="revealed text-[5rem]"
        />
      </div>
      <Text className="text-right">
        Hey! Looks like you lack the permissions to view this page or resources,
        If you think this is an error, Please contact the admin
      </Text>
      <div className="w-full flex items-center gap-2 justify-end mt-2">
        <Button variant="outline">Contact Support</Button>
        <Button asChild>
          <Link href={LINKS.SIGNIN}>Back Home</Link>
        </Button>
      </div>
    </div>
  );
}
