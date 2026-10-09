import { db } from "@/lib/prisma";

export interface ArkeselConfig {
  apiKey: string;
  senderId: string;
  sandbox: boolean;
  isConfigured: boolean;
}

export interface SendSmsOptions {
  recipients: string[];
  message: string;
  sender?: string;
  sandbox?: boolean;
  apiKey?: string;
}

export interface SendSmsResult {
  success: boolean;
  message: string;
  sentCount: number;
  validRecipients: string[];
  invalidRecipients: string[];
  data?: unknown;
  error?: string;
}

export interface BalanceResult {
  success: boolean;
  message?: string;
  smsBalance?: number | string;
  mainBalance?: number | string;
  currency?: string;
  raw?: unknown;
}

/**
 * Normalizes a phone number, especially for Ghana (+233).
 * Examples:
 *   "0244123456" -> "233244123456"
 *   "+233 24 412 3456" -> "233244123456"
 *   "233244123456" -> "233244123456"
 *   "050 123 4567" -> "233501234567"
 *   "+1 (555) 234-5678" -> "15552345678"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove whitespace, dashes, parentheses, dots
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "").trim();

  // If starts with +, strip +
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // Handle local Ghana numbers starting with 0 (e.g. 0244XXXXXX or 050XXXXXXX, 10 digits)
  if (/^0\d{9}$/.test(cleaned)) {
    return "233" + cleaned.substring(1);
  }

  // Handle Ghana numbers without leading 0 (e.g. 244XXXXXX, 9 digits)
  if (/^[25][03456789]\d{7}$/.test(cleaned)) {
    return "233" + cleaned;
  }

  // If already starts with 233 and is 12 digits
  if (/^233\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  // General international format: ensure it contains only digits and is between 8 and 15 digits
  if (/^\d{8,15}$/.test(cleaned)) {
    return cleaned;
  }

  return "";
}

/**
 * Validates and normalizes an array of phone numbers.
 */
export function sanitizePhoneNumbers(phones: string[]): {
  valid: string[];
  invalid: string[];
} {
  const validSet = new Set<string>();
  const invalid: string[] = [];

  for (const raw of phones) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const formatted = formatPhoneNumber(trimmed);
    if (formatted) {
      validSet.add(formatted);
    } else {
      invalid.push(trimmed);
    }
  }

  return {
    valid: Array.from(validSet),
    invalid,
  };
}

/**
 * Retrieve Arkesel configuration from DB system settings, falling back to process.env.
 */
export async function getArkeselConfig(): Promise<ArkeselConfig> {
  let apiKey = (process.env.ARKESEL_API_KEY || "").trim();
  let senderId = (process.env.ARKESEL_SENDER_ID || "Bayview").trim();
  let sandbox = process.env.ARKESEL_SANDBOX_MODE === "true";

  try {
    const settings = await db.systemSetting.findMany({
      where: {
        key: {
          in: ["arkeselApiKey", "arkeselSenderId", "arkeselSandbox", "smsSettings"],
        },
      },
    });

    for (const s of settings) {
      if (s.key === "arkeselApiKey" && typeof s.value === "string" && s.value.trim()) {
        apiKey = s.value.trim();
      }
      if (s.key === "arkeselSenderId" && typeof s.value === "string" && s.value.trim()) {
        senderId = s.value.trim();
      }
      if (s.key === "arkeselSandbox" && typeof s.value === "boolean") {
        sandbox = s.value;
      }
      if (s.key === "smsSettings" && typeof s.value === "object" && s.value !== null) {
        const val = s.value as Record<string, unknown>;
        if (typeof val.apiKey === "string" && val.apiKey.trim()) {
          apiKey = val.apiKey.trim();
        }
        if (typeof val.senderId === "string" && val.senderId.trim()) {
          senderId = val.senderId.trim();
        }
        if (typeof val.sandbox === "boolean") {
          sandbox = val.sandbox;
        }
      }
    }
  } catch (err) {
    console.error("Error fetching Arkesel config from DB:", err);
  }

  // Ensure Sender ID is max 11 characters (Arkesel requirement)
  if (senderId.length > 11) {
    senderId = senderId.slice(0, 11);
  }

  return {
    apiKey,
    senderId: senderId || "Bayview",
    sandbox,
    isConfigured: !!apiKey,
  };
}

/**
 * Send an SMS message using the Arkesel v2 API.
 * https://sms.arkesel.com/api/v2/sms/send
 */
export async function sendArkeselSms(options: SendSmsOptions): Promise<SendSmsResult> {
  const config = await getArkeselConfig();

  const apiKey = (options.apiKey || config.apiKey || "").trim();
  const sender = (options.sender || config.senderId || "Bayview").trim().slice(0, 11);
  const sandbox = options.sandbox !== undefined ? options.sandbox : config.sandbox;

  if (!apiKey) {
    return {
      success: false,
      message:
        "Arkesel API Key is not configured. Please add your API key in Settings -> SMS & Arkesel or in the Bulk Message page.",
      sentCount: 0,
      validRecipients: [],
      invalidRecipients: options.recipients,
    };
  }

  const { valid, invalid } = sanitizePhoneNumbers(options.recipients);

  if (valid.length === 0) {
    return {
      success: false,
      message: "No valid phone numbers found to send SMS. Ensure numbers have valid Ghana or international format.",
      sentCount: 0,
      validRecipients: [],
      invalidRecipients: invalid,
    };
  }

  const trimmedMessage = options.message.trim();
  if (!trimmedMessage) {
    return {
      success: false,
      message: "Message content cannot be empty.",
      sentCount: 0,
      validRecipients: valid,
      invalidRecipients: invalid,
    };
  }

  try {
    const payload = {
      sender,
      message: trimmedMessage,
      recipients: valid,
      sandbox: !!sandbox,
    };

    const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg =
        data?.message ||
        data?.error ||
        `Arkesel API request failed with status ${response.status} (${response.statusText})`;
      return {
        success: false,
        message: errMsg,
        sentCount: 0,
        validRecipients: valid,
        invalidRecipients: invalid,
        error: errMsg,
        data,
      };
    }

    // Check Arkesel response format (status: "success" or similar)
    const isSuccess = data?.status === "success" || response.status === 200 || response.status === 201;

    return {
      success: isSuccess,
      message: isSuccess
        ? `Successfully sent SMS to ${valid.length} recipient${valid.length !== 1 ? "s" : ""}.`
        : data?.message || "Failed to dispatch SMS through Arkesel.",
      sentCount: isSuccess ? valid.length : 0,
      validRecipients: valid,
      invalidRecipients: invalid,
      data,
    };
  } catch (error) {
    console.error("Arkesel send SMS error:", error);
    const message = error instanceof Error ? error.message : "Failed to communicate with Arkesel SMS API";
    return {
      success: false,
      message,
      sentCount: 0,
      validRecipients: valid,
      invalidRecipients: invalid,
      error: message,
    };
  }
}

/**
 * Checks account balance and connection details with Arkesel.
 * https://sms.arkesel.com/api/v2/clients/balance-details
 */
export async function checkArkeselBalance(customApiKey?: string): Promise<BalanceResult> {
  const config = await getArkeselConfig();
  const apiKey = (customApiKey || config.apiKey || "").trim();

  if (!apiKey) {
    return {
      success: false,
      message: "No Arkesel API key configured.",
    };
  }

  try {
    const response = await fetch("https://sms.arkesel.com/api/v2/clients/balance-details", {
      method: "GET",
      headers: {
        "api-key": apiKey,
        "Accept": "application/json",
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || `Balance check failed (${response.status})`,
        raw: data,
      };
    }

    // Arkesel usually returns: { status: "success", data: { sms_balance: ..., main_balance: ... } }
    const resData = data?.data || data;
    const smsBalance = resData?.sms_balance ?? resData?.smsBalance ?? resData?.balance ?? "Available";
    const mainBalance = resData?.main_balance ?? resData?.mainBalance ?? null;
    const currency = resData?.currency ?? "GHS";

    return {
      success: true,
      message: "Connected to Arkesel successfully",
      smsBalance,
      mainBalance,
      currency,
      raw: data,
    };
  } catch (err) {
    console.error("Arkesel balance check error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to connect to Arkesel API",
    };
  }
}
