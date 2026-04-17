import mongoose from "mongoose";
import Config from "@/config/main";

/**
 * Global cache to reuse the Mongoose connection across hot-reloads in dev
 * and across multiple serverless function invocations in production.
 */
declare global {
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cached = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(Config.mongodburl, {
        dbName: Config.mongodbname,
        bufferCommands: false,
      })
      .then((mg) => {
        console.log("✅ Mongoose connected to MongoDB");
        return mg;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
