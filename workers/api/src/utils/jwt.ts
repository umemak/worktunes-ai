import { SignJWT, jwtVerify } from 'jose';

export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Generate access token
 */
export async function generateAccessToken(
  payload: TokenPayload,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(secretKey);
}

/**
 * Generate refresh token
 */
export async function generateRefreshToken(
  payload: TokenPayload,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secretKey);
}

/**
 * Verify access token
 */
export async function verifyAccessToken(
  token: string,
  secret: string
): Promise<TokenPayload> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const { payload } = await jwtVerify(token, secretKey);
  return payload as unknown as TokenPayload;
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(
  token: string,
  secret: string
): Promise<TokenPayload> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const { payload } = await jwtVerify(token, secretKey);
  return payload as unknown as TokenPayload;
}
