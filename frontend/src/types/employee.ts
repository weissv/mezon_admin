export type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  rate: number;
  hireDate: string;
  branch: { id: number; name: string };
};
