import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/db/prisma.service';
import { UsersService } from 'src/users/users.service';
import { TokensService } from 'src/tokens/tokens.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UsersService, PrismaService, TokensService],
})
export class AuthModule { }
