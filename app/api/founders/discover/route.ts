import { NextResponse } from 'next/server';
import { discoverFounders } from '@/lib/youcom';

export async function POST(request: Request) {
  const body = (await request.json()) as { name: string; website: string };
  const result = await discoverFounders(body.name, body.website);
  return NextResponse.json(result);
}
