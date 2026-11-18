import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign In | MentorLagbe",
};

export default function SignInPage() {
  return <AuthForm mode="sign-in" />;
}