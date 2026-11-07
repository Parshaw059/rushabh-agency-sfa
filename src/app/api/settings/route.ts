import { NextRequest, NextResponse } from 'next/server';
import { getCloudSettings, saveCloudSettings } from '@/lib/cloudDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/settings - Fetch agency settings & logo
export async function GET() {
  try {
    const settings = await getCloudSettings();
    return NextResponse.json(
      { success: true, settings },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Update agency settings (Logo, Agency details) across all devices
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await getCloudSettings();
    const updated = {
      ...current,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveCloudSettings(updated);

    return NextResponse.json({
      success: true,
      saved,
      settings: updated,
      message: 'Agency settings and logo updated across all devices.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
