import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { UserRole } from '@/types';

// Fallback secret for local development if ADMIN_API_SECRET is not yet configured in environment
const AUTH_SECRET = process.env.ADMIN_API_SECRET || 'rushabh_agency_default_dev_secret_2026';

export interface TokenPayload {
  userId: string;
  name: string;
  role: UserRole;
  phone?: string;
  iat: number;
  exp: number; // expiry in epoch seconds
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 */
export function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresInDays = 30): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInDays * 24 * 60 * 60;
  const fullPayload: TokenPayload = { ...payload, iat, exp };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Validates and decodes a signed session token.
 */
export function verifyToken(token: string): { valid: boolean; payload?: TokenPayload; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed token format' };
    }
    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Session token expired' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Token verification failed' };
  }
}

/**
 * Middleware helper for API route authentication.
 * Checks for:
 * 1. x-admin-key header matching ADMIN_API_SECRET
 * 2. Authorization: Bearer <token> (or direct ADMIN_API_SECRET)
 * 3. rushabh_auth_token cookie
 */
export function verifyApiAuth(
  req: NextRequest,
  requiredRole?: UserRole
): { authorized: boolean; payload?: TokenPayload; response?: NextResponse } {
  // 1. Direct admin secret header bypass
  const adminKey = req.headers.get('x-admin-key');
  if (adminKey && adminKey === process.env.ADMIN_API_SECRET) {
    return {
      authorized: true,
      payload: {
        userId: 'admin-master',
        name: 'Master Admin Key',
        role: 'OWNER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
    };
  }

  // 2. Extract Bearer token or cookie
  let token: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    const cookieToken = req.cookies.get('rushabh_auth_token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  // Direct ADMIN_API_SECRET in Authorization header
  if (token && process.env.ADMIN_API_SECRET && token === process.env.ADMIN_API_SECRET) {
    return {
      authorized: true,
      payload: {
        userId: 'admin-secret',
        name: 'Admin Secret Key',
        role: 'OWNER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
    };
  }

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Missing authentication token' },
        { status: 401 }
      ),
    };
  }

  const result = verifyToken(token);
  if (!result.valid || !result.payload) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: `Unauthorized: ${result.error || 'Invalid session token'}` },
        { status: 401 }
      ),
    };
  }

  if (requiredRole && result.payload.role !== requiredRole && result.payload.role !== 'OWNER') {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: `Forbidden: Requires ${requiredRole} access privileges` },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, payload: result.payload };
}
