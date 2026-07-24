// Wraps an async producer that emits typed events into a text/event-stream Response.
export function sseResponse<E>(produce: (emit: (event: E) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: E) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await produce(emit);
      } catch (err) {
        emit({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' } as E);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
