import { NextRequest, NextResponse } from 'next/server';
import { getCloudOrders, saveCloudOrder } from '@/lib/cloudDb';
import { Order } from '@/types';

// Force dynamic execution for real-time cloud data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/orders - Fetch all orders from Cloud Store
export async function GET() {
  try {
    const { orders, source } = await getCloudOrders();
    return NextResponse.json({
      success: true,
      source,
      orders,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch orders from cloud store',
      },
      { status: 500 }
    );
  }
}

// POST /api/orders - Save new field order into Cloud Store
export async function POST(req: NextRequest) {
  try {
    const orderData: Order = await req.json();

    if (!orderData || !orderData.id || !orderData.orderNumber || !orderData.items) {
      return NextResponse.json(
        { success: false, error: 'Invalid order payload' },
        { status: 400 }
      );
    }

    const saved = await saveCloudOrder(orderData);

    return NextResponse.json({
      success: true,
      saved,
      order: orderData,
      message: 'Order recorded successfully in Cloud Store',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to insert order' },
      { status: 500 }
    );
  }
}
