import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';

type Item = { id: number; name: string; quantity: number; unit: string; expiryDate?: string; type: string };

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/inventory')
      .then(setItems)
      .catch(err => toast.error('Ошибка загрузки склада', { description: err?.message }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Складской учет</h1>
      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2">Наименование</th>
            <th className="text-left p-2">Количество</th>
            <th className="text-left p-2">Срок годности</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-t">
              <td className="p-2">{item.name}</td>
              <td className="p-2">{item.quantity} {item.unit}</td>
              <td className="p-2">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}