import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateUserAuthDto } from './dto/create-user-auth.dto';
import Hash from 'src/utils/hashing';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) { }

  register(body: CreateUserAuthDto) {
    body.password = Hash.make(body.password);

    return this.prisma.user.create({
      data: body,
    });
  }
}
