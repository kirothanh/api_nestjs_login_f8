import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './db/prisma.service';
import { AuthService } from './auth/auth.service';
import { AuthMiddleware } from './middlewares/auth/auth.middleware';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [ConfigModule.forRoot(), UsersModule, AuthModule, AdminModule],
  controllers: [AppController],
  providers: [AppService, AuthService, PrismaService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      {
        path: '/auth/profile',
        method: RequestMethod.GET,
      },
      {
        path: '/auth/logout',
        method: RequestMethod.POST,
      },
      {
        path: '/admin/*',
        method: RequestMethod.ALL,
      },
    );
  }
}
