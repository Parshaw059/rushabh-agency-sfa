import { NextRequest, NextResponse } from 'next/server';
import { deleteCloudProduct } from '@/lib/cloudDb';
import { verifyApiAuth } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

// DELETE /api/products/[id] - Remove product from Cloud Store
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyApiAuth(req, 'OWNER');
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const productId = params.id;
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteCloudProduct(productId);

    return NextResponse.json({
      success: true,
      deleted,
      message: 'Product deleted successfully from Cloud Store',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
