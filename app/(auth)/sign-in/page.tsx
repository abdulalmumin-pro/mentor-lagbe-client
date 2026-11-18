"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AuthForm, SignInData } from "@/components/auth-form";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();

  const handleSignIn = async (data: SignInData) => {
    try {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message || "Invalid email or password.");
        return;
      }

      toast.success("Signed in successfully!");
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Sign-in error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return <AuthForm mode="sign-in" onSubmit={handleSignIn} />;
}