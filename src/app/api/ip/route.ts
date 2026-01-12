import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const headersList = headers();
  // Using 'x-forwarded-for' is standard for getting the original client IP.
  const ip = headersList.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
  return NextResponse.json({ ip });
}
