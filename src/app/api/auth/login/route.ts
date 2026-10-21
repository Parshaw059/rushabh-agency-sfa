import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/serverAuth';
import { getCloudUsers } from '@/lib/cloudDb';
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

    const OWNER_DEFAULT_PIN = process.env.OWNER_PIN || '9999';
    const SALESMAN_DEFAULT_PIN = process.env.SALESMAN_PIN || '1234';

    // Fetch live users from cloud store (includes custom updated credentials)
    const cloudUsers = await getCloudUsers();
    let matchedUser: User | null = null;

    for (const u of cloudUsers) {
      const uUsername = (u.username || '').trim().toLowerCase();
      const uPhone = (u.phone || '').trim().toLowerCase();
      const uId = (u.id || '').trim().toLowerCase();
      const expectedPin = u.pin || u.password || (u.role === 'OWNER' ? OWNER_DEFAULT_PIN : SALESMAN_DEFAULT_PIN);

      // Check identifier match:
      let isIdMatch = false;
      if (uUsername && cleanId === uUsername) isIdMatch = true;
      if (uPhone && cleanId === uPhone) isIdMatch = true;
      if (uId && cleanId === uId) isIdMatch = true;

      // Role aliases
      if (u.role === 'OWNER' && (cleanId === 'owner' || cleanId === 'admin' || cleanId === '8128232377')) {
        isIdMatch = true;
      }
      if (u.role === 'SALESMAN' && (cleanId === 'hiren' || cleanId === 'salesman' || cleanId === '9825012345')) {
        isIdMatch = true;
      }

      if (isIdMatch && cleanPin === expectedPin) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Access denied.' },
        { status: 401 }
      );
    }

    // Return safe user without exposing plain PIN
    const safeUser: User = {
      id: matchedUser.id,
      name: matchedUser.name,
      role: matchedUser.role,
      phone: matchedUser.phone,
      username: matchedUser.username,
      assignedTripId: matchedUser.assignedTripId,
      assignedTripName: matchedUser.assignedTripName,
    };

    // Generate signed session token valid for 30 days
    const token = signToken({
      userId: safeUser.id,
      name: safeUser.name,
      role: safeUser.role,
      phone: safeUser.phone,
    });

    const response = NextResponse.json({
      success: true,
      user: safeUser,
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
