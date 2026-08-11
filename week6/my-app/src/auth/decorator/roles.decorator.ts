import { SetMetadata } from '@nestjs/common';

// Custom decorator to attach required roles metadata to handlers
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);