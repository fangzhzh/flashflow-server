import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  uid: string;
  email: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
