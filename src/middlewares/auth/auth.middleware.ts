import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import JWT from 'src/utils/jwt';
import { redis } from 'src/utils/redis';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) { }

  async use(req: any, res: any, next: () => void) {
    const token = req.headers.authorization?.split(' ').slice(-1).join();

    let decoded;
    try {
      decoded = JWT.verifyAccessToken(token);

      if (!decoded) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Unauthorized',
        });
      }
    } catch (error) {
      if (error.message?.includes('jwt expired')) {
        return res.status(HttpStatus.GONE).json({
          success: false,
          message: 'Need to refresh token',
        });
      }

      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized! Please Login!',
      });
    }

    // Kiểm tra token có trong blacklist không?
    const redisStore = await redis;
    const blacklist = await redisStore.get(`blacklist_${token}`);
    if (blacklist) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await this.authService.getUserByField('id', decoded.userId);
    req.user = user;
    req.token = token;

    next();
  }
}
