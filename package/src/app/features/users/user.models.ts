export interface RoleDTO {
  id: number;
  name: string;
}

export interface UserResponse {
  id: number;
  uuid: string;
  email: string;
  roles: string[];
  banned: boolean;
  dateOfBirth: string | null;
  pointsBalance: number;
}