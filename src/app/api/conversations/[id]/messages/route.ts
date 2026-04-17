import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/mongoose";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

/**
 * GET /api/conversations/[id]/messages
 * Get all messages for a specific conversation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: conversationId } = await params;

    await connectDB();

    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get all messages for this conversation
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      messages: messages.map((msg) => ({
        id: msg._id.toString(),
        role: msg.role,
        content: msg.content,
        aiModel: msg.aiModel,
        createdAt: msg.createdAt,
      })),
    });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
