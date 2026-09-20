import { NextRequest, NextResponse } from 'next/server';
import { deleteCloudDukan } from '@/lib/cloudDb';

export const dynamic = 'force-dynamic';

// DELETE /api/dukans/[id] - Remove dukan from Cloud Store
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dukanId = params.id;
    if (!dukanId) {
      return NextResponse.json(
        { success: false, error: 'Dukan ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteCloudDukan(dukanId);

    return NextResponse.json({
      success: true,
      deleted,
      message: 'Dukan deleted successfully from Cloud Store',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete dukan' },
      { status: 500 }
    );
  }
}
