import { NextRequest, NextResponse } from 'next/server';
import { updateCloudOrderItems } from '@/lib/cloudDb';
import { OrderItemRecord } from '@/types';

export const dynamic = 'force-dynamic';

// PUT /api/orders/[id] - Update order quantities and notes in Cloud Store
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await req.json();
    const updatedItems: OrderItemRecord[] = body.items;
    const notes: string | undefined = body.notes;

    if (!orderId || !updatedItems || !Array.isArray(updatedItems)) {
      return NextResponse.json(
        { success: false, error: 'Invalid update payload' },
        { status: 400 }
      );
    }

    const updated = await updateCloudOrderItems(orderId, updatedItems, notes);

    return NextResponse.json({
      success: true,
      updated,
      message: updated
        ? 'Order updated successfully in Cloud Store'
        : 'Could not update order in cloud store',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
