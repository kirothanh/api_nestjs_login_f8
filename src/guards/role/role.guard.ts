import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly requiredRole: string) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Bạn chưa đăng nhập!');
    }

    if (user.role !== this.requiredRole) {
      throw new ForbiddenException('Bạn không có quyền truy cập!');
    }

    return user?.role === this.requiredRole;
  }
}
