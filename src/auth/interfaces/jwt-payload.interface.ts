export interface JwtPayload {
  id: number;
  name: string;
  lastname: string;
  username: string;
  role?: Role;
}

interface Role {
  id: number;
  name: string;
  permissions: { id: number; name: string }[];
}
