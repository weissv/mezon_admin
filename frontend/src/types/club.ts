export type Club = {
  id: number;
  name: string;
  description?: string | null;
  teacherId: number;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
  };
  schedule?: any;
  cost?: number;
  maxStudents?: number;
};
