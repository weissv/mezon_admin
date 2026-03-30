// src/components/modals/ShoppingListModal.tsx
import { useState } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal, ModalActions } from '../Modal';
import { ShoppingListItem } from '../../types/inventory';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';

export function ShoppingListModal({ isOpen, onClose, onGenerate }: { isOpen: boolean; onClose: () => void; onGenerate: (shoppingList: ShoppingListItem[]) => void }) {
 const [dates, setDates] = useState({
 startDate: new Date().toISOString().split('T')[0],
 endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
});

 const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setDates({ ...dates, [e.target.name]: e.target.value});
};

 const handleGenerateShoppingList = async () => {
 try {
 const response = await api.post('/api/inventory/generate-shopping-list', dates);
 onGenerate(response.data.items);
 onClose();
} catch (error: any) {
 toast.error('Не удалось сформировать список', { description: error?.message ?? 'Проверьте выбранные даты и попробуйте снова' });
}
};

 return (
 <Modal
 isOpen={isOpen}
 onClose={onClose}
 title="Список закупок"
 eyebrow="Инвентарь"
 description="Выберите диапазон дат — система сформирует список недостающих позиций на выбранный период."
 icon={<ShoppingCart className="h-5 w-5" />}
 footer={
   <ModalActions>
     <Button variant="outline" onClick={onClose}>
       Отмена
     </Button>
     <Button onClick={handleGenerateShoppingList}>Сформировать</Button>
   </ModalActions>
 }
 >
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label htmlFor="startDate" className="mezon-form-label--regular block mb-1">
 Дата начала
 </label>
 <Input type="date" id="startDate" name="startDate" value={dates.startDate} onChange={handleDateChange} />
 </div>
 <div>
 <label htmlFor="endDate" className="mezon-form-label--regular block mb-1">
 Дата окончания
 </label>
 <Input type="date" id="endDate" name="endDate" value={dates.endDate} onChange={handleDateChange} />
 </div>
 </div>
 </Modal>
);
}
