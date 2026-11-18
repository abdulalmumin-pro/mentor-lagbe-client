"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Use the same classes as the navbar/footer logo so the brand matches. */
const LOGO_CLASSES = "text-2xl font-bold tracking-tight";

type Mode = "sign-in" | "sign-up";

export type SignInData = { email: string; password: string };
export type SignUpData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-0 top-0 inline-flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** Official multi-colour Google "G" logo. */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const isSignUp = mode === "sign-up";

  // Placeholder: connect your Google OAuth flow here later.
  function handleGoogle() {
    console.log(`Google ${isSignUp ? "sign-up" : "sign-in"} clicked`);
    // TODO: start Google sign-in (e.g. signIn("google") or supabase.auth.signInWithOAuth)
  }

  // Only collects the form data for now. Connect your real auth logic here later.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (isSignUp) {
      const data: SignUpData = {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        confirmPassword: String(formData.get("confirmPassword") ?? ""),
      };
      console.log("Sign-up data:", data);
      // TODO: call your sign-up API / auth function with `data`
    } else {
      const data: SignInData = {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      };
      console.log("Sign-in data:", data);
      // TODO: call your sign-in API / auth function with `data`
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <Link href="/" className={cn(LOGO_CLASSES, "mx-auto inline-block")}>
            MentorLagbe
          </Link>

          {/* Toggle between the two pages */}
          <div
            role="tablist"
            className="grid grid-cols-2 rounded-lg bg-muted p-1 text-sm font-medium"
          >
            <Link
              href="/sign-in"
              aria-current={!isSignUp ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                !isSignUp
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              aria-current={isSignUp ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                isSignUp
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign Up
            </Link>
          </div>

          <div className="space-y-1">
            <CardTitle className="text-xl">
              {isSignUp ? "Create your account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? "Sign up to find or offer tuition."
                : "Sign in to continue to MentorLagbe."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Enter your password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={isSignUp ? 8 : undefined}
                required
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full">
              {isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            {isSignUp ? "Sign up with Google" : "Sign in with Google"}
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link
              href={isSignUp ? "/sign-in" : "/sign-up"}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AuthForm;