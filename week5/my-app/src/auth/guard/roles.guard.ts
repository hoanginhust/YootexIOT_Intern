import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Retrieve allowed roles metadata from handler or class
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access publicly
    if (!requiredRoles) return true;

    // Get user from request populated by passport guard
    const { user } = context.switchToHttp().getRequest();

    // Check if user role matches the required API roles
    const hasRole = requiredRoles.includes(user?.role);
    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    return true;
  }
}