import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/mongoose";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Config from "@/config/main";

/**
 * POST /api/chat
 * Send a message and get AI response
 */
export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const { message, conversationId, model } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!model || typeof model !== "string") {
      return NextResponse.json(
        { error: "Model is required" },
        { status: 400 }
      );
    }

    await connectDB();

    let conversation;

    // If conversationId provided, verify it belongs to user
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    } else {
      // Create new conversation
      conversation = await Conversation.create({
        userId,
        title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
      });
    }

    // Get conversation history if this is an existing conversation
    let conversationHistory: Array<{ role: string; content: string }> = [];
    if (conversationId) {
      const previousMessages = await Message.find({
        conversationId: conversation._id.toString(),
      })
        .sort({ createdAt: 1 })
        .limit(20) // Limit to last 20 messages to avoid token limits
        .lean();

      conversationHistory = previousMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    }

    // Add current user message to history
    conversationHistory.push({
      role: "user",
      content: message,
    });

    // Save user message
    const userMessage = await Message.create({
      conversationId: conversation._id.toString(),
      role: "user",
      content: message,
    });

    // Call OpenRouter API with streaming
    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Config.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": Config.APP_URL,
          "X-Title": "MultiModel AI",
        },
        body: JSON.stringify({
          model: model,
          messages: conversationHistory,
          stream: true,
        }),
      }
    );

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json().catch(() => ({}));
      console.error("OpenRouter API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get AI response", details: errorData },
        { status: 500 }
      );
    }

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "start",
                conversationId: conversation._id.toString(),
                userMessage: {
                  id: userMessage._id.toString(),
                  role: userMessage.role,
                  content: userMessage.content,
                  createdAt: userMessage.createdAt,
                },
              })}\n\n`
            )
          );

          const reader = openRouterResponse.body?.getReader();
          if (!reader) {
            throw new Error("No response body");
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    fullContent += content;
                    // Send content chunk to client
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: "content",
                          content: content,
                        })}\n\n`
                      )
                    );
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Save assistant message to database
          const assistantMessage = await Message.create({
            conversationId: conversation._id.toString(),
            role: "assistant",
            content: fullContent || "No response from AI",
            aiModel: model,
          });

          // Send completion message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                assistantMessage: {
                  id: assistantMessage._id.toString(),
                  role: assistantMessage.role,
                  content: assistantMessage.content,
                  aiModel: assistantMessage.aiModel,
                  createdAt: assistantMessage.createdAt,
                },
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: "Stream processing failed",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
