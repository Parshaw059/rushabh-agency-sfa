import { NextResponse } from 'next/server';
import { checkDbConnection } from '@/lib/mysql';

export async function GET() {
  const status = await checkDbConnection();
  return NextResponse.json(status);
}
