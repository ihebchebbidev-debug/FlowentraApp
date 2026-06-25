/**
 * Push notifications via ntfy.sh — same channel as AI chat / notify.sh.
 *
 * Env (optional):
 *   VITE_NTFY_ENABLED=true|false     — default: true in production builds
 *   VITE_NTFY_BASE_URL=https://ntfy.sh
 *   VITE_NTFY_TOPIC=flowchat         — default topic (AI chat uses this)
 *   VITE_NTFY_ISSUES_TOPIC=flowentra-issues — issues topic (falls back to VITE_NTFY_TOPIC)
 */

export type NtfyPriority = '1' | '2' | '3' | '4' | '5';

export interface NtfyNotificationOptions {
  title: string;
  body: string;
  priority?: NtfyPriority;
  tags?: string[];
  /** Override topic; defaults to issues topic for issue alerts */
  topic?: string;
  /** Deep link when notification is tapped */
  click?: string;
}

const DEFAULT_BASE = 'https://ntfy.sh';

function isEnabled(): boolean {
  const flag = import.meta.env.VITE_NTFY_ENABLED;
  if (flag === 'false' || flag === '0') return false;
  if (flag === 'true' || flag === '1') return true;
  return import.meta.env.PROD;
}

function getBaseUrl(): string {
  const raw = import.meta.env.VITE_NTFY_BASE_URL || DEFAULT_BASE;
  return raw.replace(/\/$/, '');
}

export function getNtfyChatTopic(): string {
  return import.meta.env.VITE_NTFY_TOPIC || 'flowchat';
}

export function getNtfyIssuesTopic(): string {
  return import.meta.env.VITE_NTFY_ISSUES_TOPIC || import.meta.env.VITE_NTFY_TOPIC || 'flowentra-issues';
}

export async function sendNtfyNotification(options: NtfyNotificationOptions): Promise<void> {
  if (!isEnabled()) return;

  const topic = options.topic || getNtfyIssuesTopic();
  const url = `${getBaseUrl()}/${encodeURIComponent(topic)}`;

  const headers: Record<string, string> = {
    Title: options.title.slice(0, 250),
    Priority: options.priority || '3',
  };

  if (options.tags?.length) {
    headers.Tags = options.tags.join(',');
  }
  if (options.click) {
    headers.Click = options.click;
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers,
      body: options.body.slice(0, 4000),
    });
  } catch {
    // Best-effort — never block the app
  }
}

export async function sendChatNtfyNotification(question: string, response: string): Promise<void> {
  const truncatedQuestion = question.length > 200 ? `${question.slice(0, 200)}...` : question;
  const truncatedResponse = response.length > 500 ? `${response.slice(0, 500)}...` : response;

  await sendNtfyNotification({
    topic: getNtfyChatTopic(),
    title: 'AI Chat',
    priority: '3',
    tags: ['robot', 'speech_balloon'],
    body: `Q: ${truncatedQuestion}\n\nA: ${truncatedResponse}`,
  });
}
