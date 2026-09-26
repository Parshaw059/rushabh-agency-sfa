import { NextRequest, NextResponse } from 'next/server';
import { updateCloudOrderItems, deleteCloudOrder } from '@/lib/cloudDb';
import { verifyApiAuth } from '@/lib/serverAuth';
import { OrderItemRecord } from '@/types';

export const dynamic = 'force-dynamic';

// PUT /api/orders/[id] - Update order quantities and notes in Cloud Store
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyApiAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

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

// DELETE /api/orders/[id] - Delete an order completely from Cloud Store
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyApiAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteCloudOrder(orderId);

    return NextResponse.json({
      success: true,
      deleted,
      message: deleted
        ? 'Order deleted successfully from Cloud Store'
        : 'Failed to delete order from cloud store',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}
