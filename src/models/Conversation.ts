import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * IConversation represents a chat conversation/thread
 * Each user can have multiple conversations
 */
export interface IConversation extends Document {
  userId: string;
  title: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      default: "New Conversation",
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "conversations",
    versionKey: false,
  }
);

// Indexes for efficient queries
ConversationSchema.index({ userId: 1, createdAt: -1 });
ConversationSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });

const Conversation: Model<IConversation> =
  (mongoose.models.Conversation as Model<IConversation>) ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
