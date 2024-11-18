import { Controller, Get, Res, SetMetadata, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { RoleGuard } from 'src/guards/role/role.guard';

@Controller('admin')
export class AdminController {
  @Get('/profileAdmin')
  @UseGuards(new RoleGuard('ADMIN'))
  profileAdmin(@Res() res: Response) {
    return res.json({
      success: true,
      message: 'Welcome, Admin!',
    });
  }
}
