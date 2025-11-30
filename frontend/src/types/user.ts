// types/user.ts
export interface User {
  id: number;
  email: string;
  role: 'DIRECTOR' | 'DEPUTY' | 'ADMIN' | 'TEACHER' | 'ACCOUNTANT';
  employeeId: number;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    position: string;
  };
}

export interface AvailableEmployee {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  role: User['role'];
  employeeId: number;
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
  role?: User['role'];
}
