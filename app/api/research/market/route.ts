import { NextResponse } from 'next/server';
import type { CompanyInput, ThesisConfig } from '@/lib/types';
import { runResearchLeg } from '@/lib/youcom';

export async function POST(request: Request) {
  const body = (await request.json()) as { company: CompanyInput; thesis: ThesisConfig };
  const result = await runResearchLeg('market', body.company, body.thesis);
  return NextResponse.json(result);
}
