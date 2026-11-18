
"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AuthForm, SignUpData } from "@/components/auth-form";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();

  const handleSignUp = async (data: SignUpData) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const { error } = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role, // Important: Send selected role
      });

      if (error) {
        toast.error(error.message || "Sign up failed.");
        return;
      }

      toast.success("Account created successfully!");

      router.push("/");
      router.refresh();

    } catch (err) {
      console.error("Sign-up error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return <AuthForm mode="sign-up" onSubmit={handleSignUp} />;
}
