import type { CompanyInput, LegStreamEvent, ThesisConfig } from '@/lib/types';
import { runResearchLegStreaming } from '@/lib/youcom';
import { sseResponse } from '@/lib/sse';

export async function POST(request: Request) {
  let body: { company: CompanyInput; thesis: ThesisConfig };
  try {
    body = (await request.json()) as { company: CompanyInput; thesis: ThesisConfig };
  } catch {
    // A truncated/aborted request body (e.g. a client-cancelled fetch) shouldn't
    // surface as an unhandled server exception.
    return new Response(null, { status: 400 });
  }
  return sseResponse<LegStreamEvent>((emit) =>
    runResearchLegStreaming('competitive', body.company, body.thesis, emit)
  );
}
