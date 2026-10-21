import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth, signToken } from '@/lib/serverAuth';
import { getCloudUsers, saveCloudUsers } from '@/lib/cloudDb';
import { User } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Must be authenticated with active session
  const auth = verifyApiAuth(req);
  if (!auth.authorized || !auth.payload) {
    return (
      auth.response ||
      NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in first' },
        { status: 401 }
      )
    );
  }

  try {
    const body = await req.json();
    const { currentPin, newUsername, newPin, newName } = body;

    const cleanCurrentPin = (currentPin || '').trim();
    const cleanNewUsername = (newUsername || '').trim();
    const cleanNewPin = (newPin || '').trim();
    const cleanNewName = (newName || '').trim();

    if (!cleanCurrentPin) {
      return NextResponse.json(
        { success: false, error: 'Current Security PIN is required to authorize changes' },
        { status: 400 }
      );
    }

    if (!cleanNewUsername && !cleanNewPin && !cleanNewName) {
      return NextResponse.json(
        { success: false, error: 'No new credential details provided to update' },
        { status: 400 }
      );
    }

    const { userId, role } = auth.payload;
    const cloudUsers = await getCloudUsers(true);

    const userIndex = cloudUsers.findIndex(
      (u) => u.id === userId || (u.role && u.role.toLowerCase() === role.toLowerCase())
    );

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User account not found in system' },
        { status: 404 }
      );
    }

    const targetUser = cloudUsers[userIndex];
    const defaultPin = targetUser.role === 'OWNER'
      ? (process.env.OWNER_PIN || '9999')
      : (process.env.SALESMAN_PIN || '1234');

    const expectedCurrentPin = targetUser.pin || targetUser.password || defaultPin;

    // Verify current PIN
    if (cleanCurrentPin !== expectedCurrentPin) {
      return NextResponse.json(
        { success: false, error: 'Current Security PIN is incorrect. Authorization denied.' },
        { status: 400 }
      );
    }

    // Validate new username
    if (cleanNewUsername) {
      if (cleanNewUsername.length < 2) {
        return NextResponse.json(
          { success: false, error: 'Username must be at least 2 characters long.' },
          { status: 400 }
        );
      }
      const isTaken = cloudUsers.some(
        (u) => u.id !== targetUser.id && u.username?.toLowerCase() === cleanNewUsername.toLowerCase()
      );
      if (isTaken) {
        return NextResponse.json(
          { success: false, error: `Username "${cleanNewUsername}" is already taken. Please choose another.` },
          { status: 400 }
        );
      }
      targetUser.username = cleanNewUsername;
    }

    // Validate new PIN
    if (cleanNewPin) {
      if (cleanNewPin.length < 4) {
        return NextResponse.json(
          { success: false, error: 'Security PIN must be at least 4 digits or characters.' },
          { status: 400 }
        );
      }
      targetUser.pin = cleanNewPin;
      targetUser.password = cleanNewPin;
    }

    if (cleanNewName) {
      targetUser.name = cleanNewName;
    }

    targetUser.updatedAt = new Date().toISOString();
    cloudUsers[userIndex] = targetUser;

    // Persist to Cloud Store (GitHub Gist)
    const saved = await saveCloudUsers(cloudUsers);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Failed to write updated credentials to Cloud Store.' },
        { status: 500 }
      );
    }

    // Generate fresh session token
    const safeUser: User = {
      id: targetUser.id,
      name: targetUser.name,
      role: targetUser.role,
      phone: targetUser.phone,
      username: targetUser.username,
      assignedTripId: targetUser.assignedTripId,
      assignedTripName: targetUser.assignedTripName,
      updatedAt: targetUser.updatedAt,
    };

    const token = signToken({
      userId: safeUser.id,
      name: safeUser.name,
      role: safeUser.role,
      phone: safeUser.phone,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Username & Security PIN updated successfully',
      user: safeUser,
      token,
    });

    // Update session cookie
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
      { success: false, error: err?.message || 'Server error updating credentials' },
      { status: 500 }
    );
  }
}
