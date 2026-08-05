import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ActiveUserData } from '../interface/active-user.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: ActiveUserData = request.user;

    // Safely extract single field or return full payload
    return data ? user?.[data] : user;
  },
);