export type Club = {
  id: number;
  name: string;
  description: string;
  teacher: {
    firstName: string;
    lastName: string;
  };
};
