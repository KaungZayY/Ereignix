export type RefreshTokenPayload = {
  sub: number;
  type: string;
  jti: string;
}

export type JwtPayload = {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}