import { z } from 'zod';

export const maintenanceFormSchema = z.object({
  title: z.string().min(3, 'Тема заявки обязательна'),
  description: z.string().optional(),
  type: z.enum(['REPAIR', 'PURCHASE']),
});

export type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

export type MaintenanceRequest = {
  id: number;
  title: string;
  description?: string;
  type: 'REPAIR' | 'PURCHASE';
  status: 'NEW' | 'IN_PROGRESS' | 'DONE';
  requester: {
    id: number;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
};
