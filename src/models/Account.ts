import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * better-auth writes OAuth account links here (e.g. Google → userId).
 * One user can have multiple accounts (email + Google, etc.).
 */
export interface IAccount extends Document {
  userId: string;
  accountId: string;   // provider's user ID
  providerId: string;  // "google" | "credential"
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  password?: string;   // hashed — only set for email/password accounts
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: String, required: true, index: true },
    accountId: { type: String, required: true },
    providerId: { type: String, required: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    idToken: { type: String },
    accessTokenExpiresAt: { type: Date },
    refreshTokenExpiresAt: { type: Date },
    scope: { type: String },
    password: { type: String, select: false }, // exclude from queries by default
  },
  {
    timestamps: true,
    collection: "account",  // must match better-auth's collection
    versionKey: false,
  }
);

AccountSchema.index({ userId: 1, providerId: 1 });

const Account: Model<IAccount> =
  (mongoose.models.Account as Model<IAccount>) ||
  mongoose.model<IAccount>("Account", AccountSchema);

export default Account;
