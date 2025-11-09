// src/pages/InventoryPage.tsx
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/Card';
import { Button } from '../components/ui/button';
import { ShoppingListModal } from '../components/modals/ShoppingListModal';
import { Item, ShoppingListItem } from '../types/inventory';

export default function InventoryPage() {
  const { data: items, loading } = useApi<Item>({ url: '/inventory' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[] | null>(null);

  const getExpiryClass = (expiryDate?: string) => {
    if (!expiryDate) return '';
    const daysLeft = (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysLeft < 0) return 'bg-red-200 text-red-800';
    if (daysLeft < 7) return 'bg-yellow-200 text-yellow-800';
    return '';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Складской учет</h1>
        <Button onClick={() => setIsModalOpen(true)}>Сформировать список закупок</Button>
      </div>

      <Card>
        <h2 className="text-xl font-semibold p-4">Текущие остатки</h2>
        {loading ? (
          <div className="p-4">Загрузка...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Наименование</th>
                <th className="text-left p-2">Количество</th>
                <th className="text-left p-2">Срок годности</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={`border-t ${getExpiryClass(item.expiryDate)}`}>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="p-2">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {shoppingList && (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold p-4">Список закупок</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Продукт</th>
                <th className="text-left p-2">Требуется</th>
                <th className="text-left p-2">На складе</th>
                <th className="text-left p-2">Нужно закупить</th>
              </tr>
            </thead>
            <tbody>
              {shoppingList
                .filter((item) => item.toBuy > 0)
                .map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">
                      {item.requiredQty.toFixed(2)} {item.unit}
                    </td>
                    <td className="p-2">
                      {item.inStock.toFixed(2)} {item.unit}
                    </td>
                    <td className="p-2 font-bold">
                      {item.toBuy.toFixed(2)} {item.unit}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      )}

      {isModalOpen && <ShoppingListModal onClose={() => setIsModalOpen(false)} onGenerate={setShoppingList} />}
    </div>
  );
}
