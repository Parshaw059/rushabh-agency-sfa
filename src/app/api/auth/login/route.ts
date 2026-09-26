import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/serverAuth';
import { User } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, pin } = body;

    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPin = (pin || '').trim();

    if (!cleanId || !cleanPin) {
      return NextResponse.json(
        { success: false, error: 'Identifier and PIN are required' },
        { status: 400 }
      );
    }

    const OWNER_PIN = process.env.OWNER_PIN || '9999';
    const SALESMAN_PIN = process.env.SALESMAN_PIN || '1234';

    let user: User | null = null;

    // Check OWNER account credentials
    if (
      (cleanId === 'owner' || cleanId === '8128232377' || cleanId === 'admin') &&
      cleanPin === OWNER_PIN
    ) {
      user = {
        id: 'user-owner-1',
        name: 'Rushabh Agency (Owner / Admin Desk)',
        role: 'OWNER',
        phone: '8128232377',
        username: 'owner',
      };
    }
    // Check SALESMAN account credentials
    else if (
      (cleanId === 'hiren' || cleanId === '9825012345' || cleanId === 'salesman') &&
      cleanPin === SALESMAN_PIN
    ) {
      user = {
        id: 'user-salesman-hiren',
        name: 'Hiren Shah (Sales Officer)',
        role: 'SALESMAN',
        phone: '9825012345',
        username: 'hiren',
        assignedTripId: 'trip-nandesari',
        assignedTripName: 'Nandesari Beat',
      };
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Access denied.' },
        { status: 401 }
      );
    }

    // Generate signed session token valid for 30 days
    const token = signToken({
      userId: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
    });

    const response = NextResponse.json({
      success: true,
      user,
      token,
      message: 'Login successful',
    });

    // Set cookie for browser sessions
    response.cookies.set({
      name: 'rushabh_auth_token',
      value: token,
      httpOnly: false,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
