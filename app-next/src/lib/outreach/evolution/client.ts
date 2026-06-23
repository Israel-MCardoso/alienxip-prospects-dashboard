import type { EvolutionHealthResult, EvolutionProviderConfig, WhatsAppMessageInput, WhatsAppMessageResult } from "./types";
import { assertValidE164Phone } from "./validators";

export class EvolutionClient {
  readonly config: EvolutionProviderConfig;

  constructor(config: EvolutionProviderConfig = {}) {
    this.config = config;
  }

  validateMessage(input: WhatsAppMessageInput) {
    assertValidE164Phone(input.to);
    if (!input.message || input.message.trim().length === 0) {
      throw new Error("message is required");
    }
  }

  async prepareMessage(input: WhatsAppMessageInput): Promise<WhatsAppMessageResult> {
    this.validateMessage(input);
    return {
      provider: "evolution",
      status: "queued",
      dry_run: true,
      sent: false
    };
  }

  sanitizeRawStatus(value: unknown) {
    return JSON.stringify(value ?? "unknown")
      .replace(/ev-[A-Za-z0-9_-]+/g, "***redacted***")
      .replace(/sk-[A-Za-z0-9_-]+/g, "***redacted***")
      .replace(/"token"\s*:\s*"[^"]+"/gi, "\"token\":\"***redacted***\"")
      .replace(/"apikey"\s*:\s*"[^"]+"/gi, "\"apiKey\":\"***redacted***\"")
      .replace(/"apiKey"\s*:\s*"[^"]+"/g, "\"apiKey\":\"***redacted***\"");
  }

  async checkInstanceHealth(): Promise<EvolutionHealthResult> {
    const startedAt = Date.now();

    if (!this.config.baseUrl || !this.config.instance || !this.config.apiKey || !this.config.transport) {
      return {
        connected: false,
        status: "unknown",
        latency_ms: 0,
        raw_status_sanitized: "not_configured"
      };
    }

    try {
      const baseUrl = this.config.baseUrl.replace(/\/+$/, "");
      const response = await this.config.transport(`${baseUrl}/instance/connectionState/${this.config.instance}`, {
        method: "GET",
        headers: {
          apikey: this.config.apiKey
        }
      });
      const raw = await response.json();
      const rawText = this.sanitizeRawStatus(raw);
      const connected = response.ok && /open|connected|online/i.test(rawText);

      return {
        connected,
        status: connected ? "connected" : "disconnected",
        latency_ms: Date.now() - startedAt,
        raw_status_sanitized: rawText
      };
    } catch (error) {
      return {
        connected: false,
        status: "unknown",
        latency_ms: Date.now() - startedAt,
        raw_status_sanitized: this.sanitizeRawStatus({ error: error instanceof Error ? error.message : String(error) })
      };
    }
  }
}
