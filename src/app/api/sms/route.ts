import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth-helpers";
import {
  checkArkeselBalance,
  sendArkeselSms,
  getArkeselConfig,
  formatPhoneNumber,
} from "@/lib/arkesel";
import { db } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const config = await getArkeselConfig();

    if (!config.isConfigured) {
      return NextResponse.json({
        configured: false,
        senderId: config.senderId,
        sandbox: config.sandbox,
        message: "Arkesel API key is not configured.",
      });
    }

    const balanceResult = await checkArkeselBalance();

    return NextResponse.json({
      configured: true,
      senderId: config.senderId,
      sandbox: config.sandbox,
      ...balanceResult,
    });
  } catch (error) {
    console.error("GET /api/sms error:", error);
    return NextResponse.json({ error: "Failed to query SMS provider" }, { status: 500 });
  }
}

const smsActionSchema = z.object({
  action: z.enum(["test_connection", "send_test_sms", "save_quick_config"]),
  apiKey: z.string().optional(),
  senderId: z.string().max(11).optional(),
  sandbox: z.boolean().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const body = await request.json();
    const data = smsActionSchema.parse(body);

    if (data.action === "test_connection") {
      const balance = await checkArkeselBalance(data.apiKey);
      return NextResponse.json(balance);
    }

    if (data.action === "send_test_sms") {
      if (!data.phone) {
        return NextResponse.json({ error: "Recipient phone number is required" }, { status: 400 });
      }

      const formatted = formatPhoneNumber(data.phone);
      if (!formatted) {
        return NextResponse.json(
          { error: "Invalid phone number format. Please provide a valid Ghana or international phone number." },
          { status: 400 }
        );
      }

      const testMsg =
        data.message ||
        `Bayview Hotel: Test message via Arkesel SMS API. System is connected and working! Time: ${new Date().toLocaleTimeString()}`;

      const sendResult = await sendArkeselSms({
        recipients: [formatted],
        message: testMsg,
        sender: data.senderId,
        apiKey: data.apiKey,
        sandbox: data.sandbox,
      });

      if (sendResult.success) {
        await auditLog({
          userId: authResult.user.id,
          action: "SETTINGS_UPDATED",
          entity: "SystemSetting",
          newValues: { testSmsPhone: formatted, sender: data.senderId },
          request,
        });
      }

      return NextResponse.json(sendResult);
    }

    if (data.action === "save_quick_config") {
      const permCheck = await requirePermission("settings.edit");
      if (permCheck.error) return permCheck.error;

      if (!data.apiKey) {
        return NextResponse.json({ error: "API Key is required" }, { status: 400 });
      }

      const senderId = (data.senderId || "Bayview").trim().slice(0, 11);
      const sandbox = !!data.sandbox;

      await db.$transaction([
        db.systemSetting.upsert({
          where: { key: "arkeselApiKey" },
          update: { value: data.apiKey.trim() },
          create: { key: "arkeselApiKey", value: data.apiKey.trim() },
        }),
        db.systemSetting.upsert({
          where: { key: "arkeselSenderId" },
          update: { value: senderId },
          create: { key: "arkeselSenderId", value: senderId },
        }),
        db.systemSetting.upsert({
          where: { key: "arkeselSandbox" },
          update: { value: sandbox },
          create: { key: "arkeselSandbox", value: sandbox },
        }),
      ]);

      await auditLog({
        userId: authResult.user.id,
        action: "SETTINGS_UPDATED",
        entity: "SystemSetting",
        newValues: { senderId, sandbox },
        request,
      });

      // Also check balance with newly saved key
      const balance = await checkArkeselBalance(data.apiKey);

      return NextResponse.json({
        success: true,
        message: "Arkesel API configuration saved successfully!",
        senderId,
        sandbox,
        balance,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/sms error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
