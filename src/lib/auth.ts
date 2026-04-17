import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import Config from "@/config/main";

/**
 * We use the native MongoClient for better-auth's mongodbAdapter (required by the adapter).
 * The same MongoDB instance is also targeted by Mongoose (src/lib/mongoose.ts).
 *
 * Collections managed by better-auth (schemas in src/models/):
 *   user    → src/models/User.ts    — name, email, emailVerified, image (profile pic), timestamps
 *   session → src/models/Session.ts — token, userId, expiresAt, ipAddress, userAgent, timestamps
 *   account → src/models/Account.ts — OAuth links (google, credential), tokens, timestamps
 */
const client = new MongoClient(Config.mongodburl);
const db = client.db(Config.mongodbname);

// Build Google provider config only when credentials are present
const googleProvider =
  Config.GOOGLE_CLIENT_ID && Config.GOOGLE_SECRET
    ? {
        google: {
          clientId: Config.GOOGLE_CLIENT_ID,
          clientSecret: Config.GOOGLE_SECRET,
        },
      }
    : {};

export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL: Config.BETTER_AUTH_URL,
  secret: Config.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: googleProvider,
  user: {
    additionalFields: {
      // Add extra fields here as your app grows (e.g. plan, role, onboarded)
    },
  },
});
