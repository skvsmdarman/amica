import { Message } from './messages';
import { config } from '@/utils/config';

/**
 * Gets a streaming chat response from Pollinations.AI API.
 */
export async function getPollinationsChatResponseStream(messages: Message[]): Promise<ReadableStream> {
  const apiKey = config('pollinations_apikey');
  const baseUrl = config('pollinations_url') ?? 'https://text.pollinations.ai/openai';
  const model = config('pollinations_model') ?? 'openai';
  const appUrl = 'https://amica.arbius.ai'; // This will be our referrer

  const url = new URL(baseUrl);
  url.searchParams.append('referrer', appUrl);
  if (apiKey) {
    url.searchParams.append('token', apiKey);
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: messages.map(({ role, content }) => ({ role, content })),
      stream: true
    })
  });

  const reader = response.body?.getReader();
  if (!response.ok || !reader) {
    const error = await response.json();
    if (error.error?.message) {
      throw new Error(`Pollinations.AI error: ${error.error.message}`);
    }
    throw new Error(`Pollinations.AI request failed with status ${response.status}`);
  }

  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      const decoder = new TextDecoder("utf-8");
      try {
        let combined = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const data = decoder.decode(value);
          const chunks = data
            .split("data:")
            .filter((val) => !!val && val.trim() !== "[DONE]");

          for (const chunk of chunks) {
            if (chunk.length > 0 && chunk[0] === ":") {
              continue;
            }
            combined += chunk;

            try {
              const json = JSON.parse(combined);
              const messagePiece = json.choices[0].delta.content;
              combined = "";
              if (!!messagePiece) {
                controller.enqueue(messagePiece);
              }
            } catch (error) {
              // Not a full JSON object yet, continue accumulating
            }
          }
        }
      } catch (error) {
        console.error(error);
        controller.error(error);
      } finally {
        reader?.releaseLock();
        controller.close();
      }
    },
    async cancel() {
      await reader?.cancel();
      reader?.releaseLock();
    }
  });
  return stream;
}