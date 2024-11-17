import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { RegisterDto } from './dto/register.dto';
import Hash from 'src/utils/hashing';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) { }

  register(body: RegisterDto) {
    body.password = Hash.make(body.password);

    return this.prisma.user.create({
      data: body,
    });
  }

  getUserByField(field: string = 'id', value: string) {
    return this.prisma.user.findFirst({
      where: {
        [field]: value,
      },
    });
  }
}
