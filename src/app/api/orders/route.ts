import { NextRequest, NextResponse } from 'next/server';
import { getOrdersFromDb, insertOrderToDb } from '@/lib/mysql';
import { Order } from '@/types';

// GET /api/orders - Fetch all orders from MySQL database
export async function GET() {
  try {
    const orders = await getOrdersFromDb();
    if (orders !== null) {
      return NextResponse.json({
        success: true,
        source: 'mysql',
        orders,
      });
    }

    return NextResponse.json({
      success: true,
      source: 'local_fallback',
      orders: [],
      message: 'MySQL is offline or not configured; serving fallback store',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch orders from database',
      },
      { status: 500 }
    );
  }
}

// POST /api/orders - Save new field order into MySQL database
export async function POST(req: NextRequest) {
  try {
    const orderData: Order = await req.json();

    if (!orderData || !orderData.id || !orderData.orderNumber || !orderData.items) {
      return NextResponse.json(
        { success: false, error: 'Invalid order payload' },
        { status: 400 }
      );
    }

    const savedToDb = await insertOrderToDb(orderData);

    return NextResponse.json({
      success: true,
      savedToDb,
      order: orderData,
      message: savedToDb
        ? 'Order recorded successfully in MySQL database'
        : 'Order queued; MySQL database is offline or not configured',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to insert order' },
      { status: 500 }
    );
  }
}
