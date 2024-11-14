import * as jwt from 'jsonwebtoken';

export default class JWT {
  private static accessSecret = process.env.JWT_ACCESS_SECRET as string;
  private static refreshSecret = process.env.JWT_REFRESH_SECRET as string;
  private static accessExpire = process.env.JWT_ACCESS_EXPIRE as string;
  private static refreshExpire = process.env.JWT_REFRESH_EXPIRE as string;

  constructor() {
    if (!JWT.accessSecret || !JWT.refreshSecret) {
      throw new Error('Missing JWT secrets');
    }
  }

  static createAccessToken(data: object): string {
    const token = jwt.sign(data, this.accessSecret, {
      expiresIn: this.accessExpire,
    });
    return token;
  }

  static createRefreshToken(userId): string {
    const token = jwt.sign(
      {
        userId,
        secretValue: `${new Date().getTime()}-${Math.random()}`,
      },
      this.refreshSecret,
      {
        expiresIn: this.refreshExpire,
      },
    );
    return token;
  }

  static verifyAccessToken(accessToken: string) {
    try {
      return jwt.verify(accessToken, this.accessSecret);
    } catch (error) {
      throw new Error(`Invalid access token: ${error.message}`);
    }
  }

  static verifyRefreshToken(refreshToken: string): object | string {
    try {
      return jwt.verify(refreshToken, this.refreshSecret);
    } catch (error) {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
  }
}
