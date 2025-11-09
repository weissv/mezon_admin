export type Child = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  group: { id: number; name: string };
  healthInfo?: string;
};
