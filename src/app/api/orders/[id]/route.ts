import { NextRequest, NextResponse } from 'next/server';
import { updateOrderItemsInDb } from '@/lib/mysql';
import { OrderItemRecord } from '@/types';

// PUT /api/orders/[id] - Owner adjust order quantities in MySQL
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await req.json();
    const updatedItems: OrderItemRecord[] = body.items;

    if (!orderId || !updatedItems || !Array.isArray(updatedItems)) {
      return NextResponse.json(
        { success: false, error: 'Invalid update payload' },
        { status: 400 }
      );
    }

    const updated = await updateOrderItemsInDb(orderId, updatedItems);

    return NextResponse.json({
      success: true,
      updatedInDb: updated,
      message: updated
        ? 'Order quantities updated in MySQL database'
        : 'Updated locally (MySQL offline or unconfigured)',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
