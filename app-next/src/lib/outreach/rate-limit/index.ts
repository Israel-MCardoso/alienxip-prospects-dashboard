export interface RateLimitConfig {
  messagesPerHour: number;
  messagesPerDay: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  businessStartHour: number;
  businessEndHour: number;
  timezone: string;
}

export interface SendWindowInput {
  config: RateLimitConfig;
  sentAt: Date[];
  now?: Date;
}

function hourKey(date: Date) {
  return date.toISOString().slice(0, 13);
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isWithinBusinessWindow(now: Date, config: RateLimitConfig) {
  const hour = now.getHours();
  return hour >= config.businessStartHour && hour < config.businessEndHour;
}

export function canSendMessage(input: SendWindowInput) {
  const now = input.now ?? new Date();
  const sentAt = input.sentAt || [];

  if (!isWithinBusinessWindow(now, input.config)) {
    return { allowed: false, reason: "outside_business_window" as const, queued: true };
  }

  const currentHour = hourKey(now);
  const currentDay = dayKey(now);
  const hourlyCount = sentAt.filter((sent) => hourKey(sent) === currentHour).length;
  const dailyCount = sentAt.filter((sent) => dayKey(sent) === currentDay).length;

  if (hourlyCount >= input.config.messagesPerHour) {
    return { allowed: false, reason: "hourly_limit_reached" as const, queued: true };
  }
  if (dailyCount >= input.config.messagesPerDay) {
    return { allowed: false, reason: "daily_limit_reached" as const, queued: true };
  }

  return { allowed: true, reason: "allowed" as const, queued: false };
}

export function getRandomDelayMs(config: RateLimitConfig, random: () => number = Math.random) {
  const min = Math.max(0, config.minDelaySeconds);
  const max = Math.max(min, config.maxDelaySeconds);
  const value = min + (max - min) * Math.max(0, Math.min(1, random()));
  return Math.round(value * 1000);
}
