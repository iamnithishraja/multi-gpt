import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * better-auth writes session records here after sign-in.
 * Keeping a Mongoose model lets you query/invalidate sessions from app code.
 */
export interface ISession extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
    collection: "session",  // must match better-auth's collection
    versionKey: false,
  }
);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index — auto-deletes expired sessions

const Session: Model<ISession> =
  (mongoose.models.Session as Model<ISession>) ||
  mongoose.model<ISession>("Session", SessionSchema);

export default Session;
