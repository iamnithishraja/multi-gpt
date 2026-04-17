import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * IMessage represents a single message in a conversation
 * Can be from either the user or the AI assistant
 */
export interface IMessage extends Document {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  aiModel?: string; // The AI model used for assistant messages
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: String,
      required: [true, "Conversation ID is required"],
      index: true,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: ["user", "assistant"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    aiModel: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "messages",
    versionKey: false,
  }
);

// Indexes for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: 1 });

const Message: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) ||
  mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
