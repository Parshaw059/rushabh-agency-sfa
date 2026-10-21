import { NextResponse } from 'next/server';
import {
  getCloudOrders,
  getCloudDukans,
  getCloudProducts,
  getCloudCompanies,
  getCloudUsers,
} from '@/lib/cloudDb';

// Force dynamic execution for real-time cloud data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/sync - Unified single round-trip fetch for all entities (Orders, Dukans, Products, Companies, Users)
export async function GET() {
  try {
    const [
      ordersRes,
      dukansRes,
      productsRes,
      companiesRes,
      usersRes,
    ] = await Promise.all([
      getCloudOrders(),
      getCloudDukans(),
      getCloudProducts(),
      getCloudCompanies(),
      getCloudUsers(),
    ]);

    const safeUsers = usersRes.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      phone: u.phone,
      username: u.username,
      assignedTripId: u.assignedTripId,
      assignedTripName: u.assignedTripName,
    }));

    return NextResponse.json(
      {
        success: true,
        orders: ordersRes.orders || [],
        deletedOrderIds: ordersRes.deletedIds || [],
        dukans: dukansRes.dukans || [],
        deletedDukanIds: dukansRes.deletedIds || [],
        products: productsRes.products || [],
        deletedProductIds: productsRes.deletedIds || [],
        companies: companiesRes.companies || [],
        deletedCompanyIds: companiesRes.deletedIds || [],
        users: safeUsers,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to sync data from cloud store',
      },
      { status: 500 }
    );
  }
}
