"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AuthForm, SignInData } from "@/components/auth-form";
import { authClient } from "@/lib/auth-client";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const router = useRouter();
  const { redirect } = use(searchParams);

  const handleSignIn = async (data: SignInData) => {
    try {
      const { data: result, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message || "Invalid email or password.");
        return;
      }

      toast.success("Signed in successfully!");

      // Send each role to its own dashboard unless a safe redirect was given.
      let role = (result?.user as { role?: string } | undefined)?.role;
      if (!role) {
        const session = await authClient.getSession();
        role = (session.data?.user as { role?: string } | undefined)?.role;
      }

      const dashboard =
        role === "admin" || role === "tutor"
          ? `/dashboard/${role}`
          : "/dashboard/student";

      const target =
        typeof redirect === "string" && redirect.startsWith("/")
          ? redirect
          : dashboard;
      router.push(target);
      router.refresh();
    } catch (err) {
      console.error("Sign-in error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return <AuthForm mode="sign-in" onSubmit={handleSignIn} />;
}