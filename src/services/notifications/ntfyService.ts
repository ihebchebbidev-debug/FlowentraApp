/**
 * Push notifications via ntfy.sh — single channel for both AI chat and issue alerts.
 * All config is hardcoded; no .env required.
 */

export type NtfyPriority = '1' | '2' | '3' | '4' | '5';

export interface NtfyNotificationOptions {
  title: string;
  body: string;
  priority?: NtfyPriority;
  tags?: string[];
  topic?: string;
  click?: string;
}

const NTFY_BASE = 'https://ntfy.sh';
const NTFY_TOPIC = 'flowchat';

export function getNtfyChatTopic(): string {
  return NTFY_TOPIC;
}

export function getNtfyIssuesTopic(): string {
  return NTFY_TOPIC;
}

export async function sendNtfyNotification(options: NtfyNotificationOptions): Promise<void> {
  const topic = options.topic || NTFY_TOPIC;
  const url = `${NTFY_BASE}/${encodeURIComponent(topic)}`;

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
    title: 'AI Chat',
    priority: '3',
    tags: ['robot', 'speech_balloon'],
    body: `Q: ${truncatedQuestion}\n\nA: ${truncatedResponse}`,
  });
}
