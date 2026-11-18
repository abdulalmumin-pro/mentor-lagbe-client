'use client';

import { AuthForm, SignUpData } from "@/components/auth-form"
import { authClient } from "@/lib/auth-client"


export default function SignUpPage() {
  const handleSignUp = async ( data: SignUpData ) => {
    const { data: res, error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
      callbackURL: "/",
    })
    console.log('signUp responsive', res, error);
  }
  return <AuthForm mode="sign-up" onSubmit={handleSignUp} />
}
