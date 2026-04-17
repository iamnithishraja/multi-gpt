import { createAuthClient } from "better-auth/react";
import Config from "@/config/main";

export const authClient = createAuthClient({
  baseURL: Config.APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
