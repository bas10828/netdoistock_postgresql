import { SignJWT, jwtVerify } from 'jose';

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'change-this-secret-in-production');

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret());
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}
