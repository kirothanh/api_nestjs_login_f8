import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class TokensService {
  constructor(private prisma: PrismaService) { }

  async createToken(accessToken: string, refreshToken: string) {
    return await this.prisma.token.create({
      data: {
        accessToken,
        refreshToken,
        blacklist: false,
      },
    });
  }

  async findToken(accessToken: string) {
    return await this.prisma.token.findUnique({
      where: { accessToken },
    });
  }

  async blacklistToken(accessToken: string) {
    return await this.prisma.token.update({
      where: { accessToken },
      data: { blacklist: true },
    });
  }

  async deleteToken(accessToken: string) {
    await this.prisma.token.delete({
      where: { accessToken },
    });
  }
}
