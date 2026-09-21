export interface RoleDTO {
  id: number;
  name: string;
}

export interface UserResponse {
  id: number;
  uuid: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  roles: string[];
  banned: boolean;
  dateOfBirth: string | null;
  pointsBalance: number;
}