export type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  position: string;
  rate: number;
  hireDate: string;
  branch: { id: number; name: string };
  user?: { id: number; email: string; role: string } | null;
};
