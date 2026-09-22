import { NextRequest, NextResponse } from 'next/server';
import { getCloudCompanies, saveCloudCompany, deleteCloudCompany } from '@/lib/cloudDb';
import { Company } from '@/types';
import { INITIAL_COMPANIES } from '@/data/mockData';

// Force dynamic execution for real-time cloud data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/companies - Fetch all companies from Cloud Store / MySQL
export async function GET() {
  try {
    const { companies, deletedIds, source } = await getCloudCompanies();
    
    // Merge with INITIAL_COMPANIES so all default brands are always present
    const map = new Map<string, Company>();
    for (const c of INITIAL_COMPANIES) {
      if (!deletedIds.includes(c.id)) {
        map.set(c.id, c);
      }
    }
    for (const c of companies) {
      if (!deletedIds.includes(c.id)) {
        map.set(c.id, { ...(map.get(c.id) || {}), ...c });
      }
    }

    const merged = Array.from(map.values());

    return NextResponse.json(
      {
        success: true,
        source,
        companies: merged,
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
        error: error?.message || 'Failed to fetch companies from cloud store',
      },
      { status: 500 }
    );
  }
}

// POST /api/companies - Save new company to Cloud Store & MySQL
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const company: Company = payload.company || payload;

    if (!company || !company.id || !company.name) {
      return NextResponse.json(
        { success: false, error: 'Invalid company payload: id and name are required' },
        { status: 400 }
      );
    }

    const saved = await saveCloudCompany(company);
    return NextResponse.json({
      success: true,
      saved,
      company,
      message: 'Company saved successfully to Cloud Store & MySQL',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to save company to cloud store',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/companies - Delete company from Cloud Store & MySQL
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Company id is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteCloudCompany(id);
    return NextResponse.json({
      success: true,
      deleted,
      id,
      message: 'Company deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to delete company',
      },
      { status: 500 }
    );
  }
}
