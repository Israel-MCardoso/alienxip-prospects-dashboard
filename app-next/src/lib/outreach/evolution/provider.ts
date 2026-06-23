import { EvolutionClient } from "./client";
import type { EvolutionProviderConfig, WhatsAppMessageInput, WhatsAppMessageResult, WhatsAppProvider } from "./types";
import { assertValidE164Phone } from "./validators";

export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly name = "mock-whatsapp" as const;
  readonly enabled = true;

  async sendMessage(input: WhatsAppMessageInput): Promise<WhatsAppMessageResult> {
    assertValidE164Phone(input.to);
    return {
      provider: this.name,
      status: "queued",
      message_id: `mock-${Date.now()}`,
      dry_run: true,
      sent: false
    };
  }

  async getStatus() {
    return { connected: false, status: "mock" as const, latency_ms: 0 };
  }

  async checkInstanceHealth() {
    return {
      connected: false,
      status: "unknown" as const,
      latency_ms: 0,
      raw_status_sanitized: "mock_provider"
    };
  }
}

export class EvolutionProvider implements WhatsAppProvider {
  readonly name = "evolution" as const;
  readonly enabled = false;
  private readonly client: EvolutionClient;

  constructor(config: EvolutionProviderConfig = {}) {
    this.client = new EvolutionClient(config);
  }

  async sendMessage(input: WhatsAppMessageInput): Promise<WhatsAppMessageResult> {
    await this.client.prepareMessage(input);
    throw new Error("EvolutionProvider is disabled. No real WhatsApp message was sent.");
  }

  async getStatus() {
    return { connected: false, status: "disabled" as const };
  }

  async checkInstanceHealth() {
    return this.client.checkInstanceHealth();
  }
}

export function getWhatsAppProvider(options: { env?: Record<string, string | undefined> } = {}): WhatsAppProvider {
  const env = options.env ?? process.env;
  if (env.EVOLUTION_PROVIDER_ENABLED !== "true" || env.OUTREACH_PRODUCTION_ENABLED !== "true") {
    return new MockWhatsAppProvider();
  }

  return new EvolutionProvider({
    baseUrl: env.EVOLUTION_API_URL,
    instance: env.EVOLUTION_INSTANCE,
    apiKey: env.EVOLUTION_API_KEY
  });
}
