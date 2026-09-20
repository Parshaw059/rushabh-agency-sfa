import { NextRequest, NextResponse } from 'next/server';
import { getCloudDukans, saveCloudDukan, saveCloudDukansBatch } from '@/lib/cloudDb';
import { Dukan } from '@/types';

// Force dynamic execution for real-time cloud data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/dukans - Fetch all dukans from Cloud Store
export async function GET() {
  try {
    const { dukans, deletedIds, source } = await getCloudDukans();
    return NextResponse.json({
      success: true,
      source,
      dukans,
      deletedIds: deletedIds || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch dukans from cloud store',
      },
      { status: 500 }
    );
  }
}

// POST /api/dukans - Save one or multiple dukans to Cloud Store
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Case 1: Batch of dukans
    if (Array.isArray(payload.dukans)) {
      const saved = await saveCloudDukansBatch(payload.dukans);
      return NextResponse.json({
        success: true,
        saved,
        count: payload.dukans.length,
        message: 'Batch dukans synced successfully to Cloud Store',
      });
    }

    // Case 2: Single dukan
    const dukan: Dukan = payload.dukan || payload;
    if (!dukan || !dukan.id || !dukan.shopName) {
      return NextResponse.json(
        { success: false, error: 'Invalid dukan payload' },
        { status: 400 }
      );
    }

    const saved = await saveCloudDukan(dukan);
    return NextResponse.json({
      success: true,
      saved,
      dukan,
      message: 'Dukan recorded successfully in Cloud Store',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save dukan' },
      { status: 500 }
    );
  }
}
