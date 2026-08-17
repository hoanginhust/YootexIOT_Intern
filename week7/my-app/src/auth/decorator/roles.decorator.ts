import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
// Custom decorator using Prisma Role enum for type-safe RBAC
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);