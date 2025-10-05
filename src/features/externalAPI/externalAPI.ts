import { config, defaults, prefixed } from "@/utils/config";
import isDev from "@/utils/isDev";
import {
  MAX_STORAGE_TOKENS,
  TimestampedPrompt,
} from "../amicaLife/eventHandler";
import { Message } from "../chat/messages";

function createApiUrl(type: string): URL {
  const baseUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_BASE_URL;
  // During build, baseUrl can be undefined. We provide a dummy URL to prevent crashes.
  const url = new URL(baseUrl ? `${baseUrl}/api/dataHandler` : 'http://localhost:3000/api/dummy');
  if (baseUrl) {
    url.searchParams.append("type", type);
  }
  return url;
}

// Cached server config
export let serverConfig: Record<string, string> = {};

export async function fetcher(method: string, url: URL, data?: any) {
  if (url.pathname.includes('dummy')) {
    return; // Don't fetch if using the dummy URL
  }

  let response: any;
  switch (method) {
    case "POST":
      try {
        response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error("Failed to POST server config: ", error);
      }
      break;

    case "GET":
      try {
        response = await fetch(url);
        if (response.ok) {
          serverConfig = await response.json();
        }
      } catch (error) {
        console.error("Failed to fetch server config:", error);
      }
      break;

    default:
      break;
  }
}

export async function handleConfig(
  type: string,
  data?: Record<string, string>,
) {
  if (!isDev) {
    return;
  }
  const configUrl = createApiUrl("config");

  switch (type) {
    case "init":
      let localStorageData: Record<string, string> = {};

      for (const key in defaults) {
        const localKey = prefixed(key);
        const value = localStorage.getItem(localKey);

        if (value !== null) {
          localStorageData[key] = value;
        } else {
          localStorageData[key] = (<any>defaults)[key];
        }
      }
      await fetcher("POST", configUrl, localStorageData);
      break;
    case "fetch":
      await fetcher("GET", configUrl);
      break;
    case "update":
      await fetcher("POST", configUrl, data);
      break;
    default:
      break;
  }
}

export async function handleUserInput(message: string) {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }
  const userInputUrl = createApiUrl("userInputMessages");

  fetch(userInputUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt: config("system_prompt"),
      message: message,
    }),
  });
}

export async function handleChatLogs(messages: Message[]) {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }
  const chatLogsUrl = createApiUrl("chatLogs");

  fetch(chatLogsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
}

export async function handleSubconscious(
  timestampedPrompt: TimestampedPrompt,
): Promise<any> {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }
  const subconsciousUrl = createApiUrl("subconscious");

  const data = await fetch(subconsciousUrl);
  if (!data.ok) {
    throw new Error("Failed to get subconscious data");
  }

  const currentStoredSubconscious: TimestampedPrompt[] = await data.json();
  currentStoredSubconscious.push(timestampedPrompt);

  let totalStorageTokens = currentStoredSubconscious.reduce(
    (totalTokens, prompt) => totalTokens + prompt.prompt.length,
    0,
  );
  while (totalStorageTokens > MAX_STORAGE_TOKENS) {
    const removed = currentStoredSubconscious.shift();
    totalStorageTokens -= removed!.prompt.length;
  }

  const response = await fetch(subconsciousUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subconscious: currentStoredSubconscious }),
  });

  if (!response.ok) {
    throw new Error("Failed to update subconscious data");
  }

  return currentStoredSubconscious;
}