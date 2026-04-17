import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * IUser mirrors the fields that better-auth writes to the `user` collection,
 * plus any extra app-level fields you want to add in the future.
 *
 * better-auth writes:
 *   id            — string (UUID)
 *   name          — string  (required; captured at sign-up or synced from Google)
 *   email         — string  (required; unique)
 *   emailVerified — boolean (true after email verification flow)
 *   image         — string  (profile picture URL; synced from Google, or null)
 *   createdAt     — Date
 *   updatedAt     — Date
 */
export interface IUser extends Document {
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: null, // profile picture URL (populated by Google OAuth automatically)
    },
  },
  {
    timestamps: true,      // auto-manages createdAt & updatedAt
    collection: "user",    // MUST match the collection name better-auth uses
    versionKey: false,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });

/**
 * Export the model — using `mongoose.models.User` guard prevents
 * "Cannot overwrite model once compiled" errors on hot-reload.
 */
const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
