import { z } from 'zod';
import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Req,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginAuthDto } from './dto/login.dto';
import Hash from 'src/utils/hashing';
import JWT from 'src/utils/jwt';
import { redis } from 'src/utils/redis';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() body: RegisterDto, @Res() res) {
    // Validate
    const schema = z.object({
      name: z
        .string({
          required_error: 'Tên bắt buộc phải nhập',
        })
        .min(4, 'Tên phải từ 4 ký tự'),
      email: z
        .string({
          required_error: 'Email bắt buộc phải nhập',
        })
        .email('Email không đúng định dạng')
        .refine(async (email) => {
          const user = await this.authService.getUserByField('email', email);
          return !user;
        }, 'Email đã có người sử dụng'),
      password: z
        .string({
          required_error: 'Mật khẩu bắt buộc phải nhập',
        })
        .min(6, 'Mật khẩu phải từ 6 ký tự'),
    });

    const validateFields = await schema.safeParseAsync(body);
    if (!validateFields.success) {
      const errors = validateFields.error.flatten().fieldErrors;
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        errors: errors,
        message: 'Validate failed',
      });
    }

    const data = await this.authService.register({
      ...body,
      role: 'USER',
    });
    return res.status(HttpStatus.CREATED).json(data);
  }

  @Post('login')
  async login(@Body() body: LoginAuthDto, @Res() res) {
    const { email, password } = body;

    // Validate dữ liệu
    const schema = z.object({
      email: z
        .string({
          required_error: 'Email bắt buộc phải nhập',
        })
        .email('Email không đúng định dạng'),
      password: z
        .string({
          required_error: 'Mật khẩu bắt buộc phải nhập',
        })
        .min(6, 'Mật khẩu phải từ 6 ký tự'),
    });

    const validateFields = await schema.safeParseAsync(body);
    if (!validateFields.success) {
      const errors = validateFields.error.flatten().fieldErrors;
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        errors: errors,
        message: 'Validate failed',
      });
    }

    // Truy vấn
    const user = await this.authService.getUserByField('email', email);

    if (!user) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    if (!Hash.verify(password, user.password)) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized',
      });
    }

    const accessToken = JWT.createAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = JWT.createRefreshToken(user.id);

    const redisStore = await redis;
    await redisStore.set(
      `refreshToken_${user.id}`,
      JSON.stringify({
        refreshToken,
        email,
      }),
    );

    return res.status(HttpStatus.CREATED).json({
      message: 'Login Successfully',
      data: {
        accessToken,
        refreshToken,
      },
    });
  }

  @Get('profile')
  profile(@Req() req: any, @Res() res: Response) {
    return res.json({
      success: true,
      message: 'Get Profile Success',
      data: req.user,
    });
  }

  @Post('logout')
  async logout(@Req() req: any) {
    const token = req.token;

    const redisStore = await redis;
    await redisStore.set(`blacklist_${token}`, 1);

    return { success: true, message: 'Logout success' };
  }

  @Post('refreshToken')
  async refreshToken(@Req() req, @Res() res) {
    try {
      const { refreshToken } = req.body;
      const { userId } = JWT.verifyRefreshToken(refreshToken);

      const redisStore = await redis;
      const tokenFromRedis = await redisStore.get(`refreshToken_${userId}`);
      if (!tokenFromRedis) {
        throw new Error('Refresh token not found');
      }

      const accessToken = JWT.createAccessToken({
        userId,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
        },
        message: 'Refresh token successfully',
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token failed',
        errors: error.message,
      });
    }
  }
}
