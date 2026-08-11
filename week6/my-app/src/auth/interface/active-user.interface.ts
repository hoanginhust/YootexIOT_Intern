// Interface matching the payload injected into req.user by JwtStrategy
export interface ActiveUserData {
  id: number;
  email: string;
  role: string;
}