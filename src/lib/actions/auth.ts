"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type LoginState = { error?: string } | undefined;

export async function authenticate(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "E-mail ou senha inválidos." };
      }
      return { error: "Não foi possível entrar. Tente novamente." };
    }
    // signIn lança um redirect em caso de sucesso — repropagar.
    throw error;
  }
}

export async function doSignOut() {
  await signOut({ redirectTo: "/login" });
}
