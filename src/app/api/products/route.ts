import { NextRequest, NextResponse } from 'next/server';
import { getCloudProducts, saveCloudProduct, saveCloudProductsBatch } from '@/lib/cloudDb';
import { Product } from '@/types';

// Force dynamic execution for real-time cloud data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/products - Fetch all products from Cloud Store
export async function GET() {
  try {
    const { products, deletedIds, source } = await getCloudProducts();
    return NextResponse.json(
      {
        success: true,
        source,
        products,
        deletedIds: deletedIds || [],
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
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch products from cloud store',
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Save one or multiple products to Cloud Store
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Case 1: Batch of products
    if (Array.isArray(payload.products)) {
      const saved = await saveCloudProductsBatch(payload.products);
      return NextResponse.json({
        success: true,
        saved,
        count: payload.products.length,
        message: 'Batch products synced successfully to Cloud Store',
      });
    }

    // Case 2: Single product
    const product: Product = payload.product || payload;
    if (!product || !product.id || !product.name) {
      return NextResponse.json(
        { success: false, error: 'Invalid product payload' },
        { status: 400 }
      );
    }

    const saved = await saveCloudProduct(product);
    return NextResponse.json({
      success: true,
      saved,
      product,
      message: 'Product saved successfully to Cloud Store',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to save product to cloud store',
      },
      { status: 500 }
    );
  }
}
