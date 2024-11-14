import { z } from 'zod';
import { Controller, Post, Body, Res, HttpStatus, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserAuthDto } from './dto/create-user-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UsersService } from 'src/users/users.service';
import Hash from 'src/utils/hashing';
import JWT from 'src/utils/jwt';
import { TokensService } from 'src/tokens/tokens.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokensService,
  ) { }

  @Post('register')
  async register(@Body() body: CreateUserAuthDto, @Res() res) {
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
          const user = await this.usersService.findByEmail(email);
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

    const data = await this.authService.register(body);
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
    const user = await this.usersService.findByEmail(email);

    if (!Hash.verify(password, user.password)) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized',
      });
    }

    const accessToken = JWT.createAccessToken({
      userId: user.id,
    });
    const refreshToken = JWT.createAccessToken({
      userId: user.id,
    });

    await this.tokenService.createToken(accessToken, refreshToken);

    return res.json({
      message: 'Login Successfully',
      data: {
        accessToken,
        refreshToken,
      },
    });
  }

  @Post('logout')
  async logout(@Headers('authorization') authHeader: string, @Res() res) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }
    const accessToken = authHeader.split(' ')[1];

    await this.tokenService.blacklistToken(accessToken);

    return res.json({
      message: 'Logout successfully',
    });
  }
}
