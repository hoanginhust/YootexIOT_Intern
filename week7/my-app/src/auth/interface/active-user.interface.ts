import { Role } from '@prisma/client';

// Payload structure injected into req.user after JWT verification
export interface ActiveUserData {
  id: number;
  email: string;
  role: Role;
}