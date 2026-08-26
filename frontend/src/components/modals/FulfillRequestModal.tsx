// src/components/modals/FulfillRequestModal.tsx
import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { MaintenanceRequest, itemCategoryLabels, itemCategoryColors } from '../../types/maintenance';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, Package, Loader2, Info } from 'lucide-react';

interface FulfillRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest | null;
  onSuccess: () => void;
}

interface ItemFulfillmentState {
  itemId: number;
  name: string;
  unit: string;
  category: string;
  requested: number;
  inStock: number;
  issuedQuantity: number;
}

export function FulfillRequestModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: FulfillRequestModalProps) {
  const [itemsState, setItemsState] = useState<ItemFulfillmentState[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Загружаем актуальные остатки со склада для позиций заявки
  useEffect(() => {
    if (!isOpen || !request || !request.items) {
      setItemsState([]);
      return;
    }

    const initItems = async () => {
      setLoading(true);
      try {
        // Проверяем доступность остатков через эндпоинт проверки
        const stockCheck = await api.get(`/api/maintenance/${request.id}/stock-check`);
        const stockMap = new Map<string, number>();

        if (stockCheck?.items && Array.isArray(stockCheck.items)) {
          for (const s of stockCheck.items) {
            stockMap.set(s.name.toLowerCase().trim(), s.inStock ?? 0);
          }
        }

        const initialized = request.items!.map((item) => {
          const inStock =
            item.inventoryItem?.quantity ??
            stockMap.get(item.name.toLowerCase().trim()) ??
            0;

          // По умолчанию выдаем либо уже ранее установленное issuedQuantity, либо минимум из запрошенного и остатка
          const defaultIssued =
            item.issuedQuantity != null
              ? item.issuedQuantity
              : Math.min(item.quantity, inStock);

          return {
            itemId: item.id,
            name: item.name,
            unit: item.unit,
            category: item.category,
            requested: item.quantity,
            inStock,
            issuedQuantity: defaultIssued,
          };
        });

        setItemsState(initialized);
      } catch (err) {
        console.error('Ошибка инициализации позиций для выдачи:', err);
        // Резервный расчет на основе данных заявки
        const fallback = request.items!.map((item) => ({
          itemId: item.id,
          name: item.name,
          unit: item.unit,
          category: item.category,
          requested: item.quantity,
          inStock: item.inventoryItem?.quantity ?? 0,
          issuedQuantity:
            item.issuedQuantity != null
              ? item.issuedQuantity
              : Math.min(item.quantity, item.inventoryItem?.quantity ?? 0),
        }));
        setItemsState(fallback);
      } finally {
        setLoading(false);
      }
    };

    initItems();
  }, [isOpen, request]);

  const handleQuantityChange = (itemId: number, newQty: number) => {
    setItemsState((prev) =>
      prev.map((item) => {
        if (item.itemId !== itemId) return item;
        const validQty = Math.max(0, Math.min(newQty, item.inStock));
        return { ...item, issuedQuantity: validQty };
      })
    );
  };

  const handleSetMax = (itemId: number) => {
    setItemsState((prev) =>
      prev.map((item) => {
        if (item.itemId !== itemId) return item;
        return { ...item, issuedQuantity: Math.min(item.requested, item.inStock) };
      })
    );
  };

  const handleSetZero = (itemId: number) => {
    setItemsState((prev) =>
      prev.map((item) => {
        if (item.itemId !== itemId) return item;
        return { ...item, issuedQuantity: 0 };
      })
    );
  };

  // Проверка: все ли позиции выданы на 100%
  const isFullFulfillment = itemsState.every(
    (i) => i.issuedQuantity === i.requested
  );

  const totalIssued = itemsState.reduce((sum, i) => sum + i.issuedQuantity, 0);
  const totalRequested = itemsState.reduce((sum, i) => sum + i.requested, 0);

  const handleSubmit = async () => {
    if (!request) return;
    setSubmitting(true);
    try {
      const payload = {
        issuedItems: itemsState.map((i) => ({
          itemId: i.itemId,
          issuedQuantity: i.issuedQuantity,
        })),
      };

      const result = await api.post(`/api/maintenance/${request.id}/fulfill`, payload);
      
      if (result?.isPartial) {
        toast.warning(`Заявка выполнена ЧАСТИЧНО: выдано ${totalIssued} из ${totalRequested} ед.`, {
          duration: 5000,
        });
      } else {
        toast.success('Заявка выполнена полностью! Товары списаны со склада.');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Ошибка выполнения выдачи:', error);
      toast.error('Ошибка выдачи товаров', {
        description: error?.message || 'Не удалось выполнить выдачу по заявке',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Выдача товаров по заявке #${request.id}`}
    >
      <div className="p-4 space-y-4 max-w-2xl">
        {/* Карточка заголовка заявки */}
        <div className="p-3.5 rounded-2xl bg-fill-quaternary/40 border border-separator/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-macos-blue" />
              <span className="font-bold text-text-primary text-[14.5px]">
                {request.title}
              </span>
            </div>
            {request.description && (
              <p className="text-text-secondary text-[12px] mt-1">
                {request.description}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[11px] text-text-tertiary uppercase font-bold block">
              Заявитель
            </span>
            <span className="font-semibold text-text-primary">
              {request.requester
                ? `${request.requester.lastName} ${request.requester.firstName}`
                : '—'}
            </span>
          </div>
        </div>

        {/* Таблица позиций к выдаче */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] font-bold uppercase tracking-wider text-text-tertiary">
              Позиции к выдаче (укажите фактическое количество):
            </label>
            <span className="text-[11px] text-text-secondary">
              Всего позиций: {itemsState.length}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-text-secondary flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-macos-blue" />
              <span className="text-[13px]">Проверка остатков на складе...</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {itemsState.map((item) => {
                const isShortage = item.inStock < item.requested;
                const isZeroStock = item.inStock <= 0;
                const isPartiallyIssued = item.issuedQuantity < item.requested;

                return (
                  <div
                    key={item.itemId}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isPartiallyIssued
                        ? 'border-macos-orange/40 bg-amber-50/20'
                        : 'border-separator/70 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Описание позиции */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[14px] text-text-primary truncate">
                            {item.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              itemCategoryColors[item.category as keyof typeof itemCategoryColors] ||
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {itemCategoryLabels[item.category as keyof typeof itemCategoryLabels] ||
                              item.category}
                          </span>
                        </div>

                        {/* Статусы запрошено / остаток */}
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[12px]">
                          <span className="text-text-secondary">
                            Запрошено: <strong className="text-text-primary">{item.requested} {item.unit}</strong>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                              isZeroStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isShortage
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isZeroStock
                              ? 'Нет на складе (0)'
                              : `На складе: ${item.inStock} ${item.unit}`}
                          </span>
                        </div>
                      </div>

                      {/* Поле ввода фактически к выдаче */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-28">
                          <label className="block text-[10px] uppercase font-bold text-text-tertiary mb-0.5">
                            К выдаче ({item.unit})
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max={item.inStock}
                            step="0.01"
                            value={item.issuedQuantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.itemId,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className={`h-9 text-[13.5px] font-mono font-bold text-center ${
                              item.issuedQuantity < item.requested
                                ? 'text-macos-orange border-macos-orange/50 focus:ring-macos-orange'
                                : 'text-macos-green border-macos-green/50'
                            }`}
                          />
                        </div>

                        {/* Кнопки быстрой установки */}
                        <div className="flex flex-col gap-1 pt-3.5">
                          <button
                            type="button"
                            onClick={() => handleSetMax(item.itemId)}
                            disabled={item.inStock <= 0}
                            className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-fill-tertiary hover:bg-fill-secondary text-text-secondary disabled:opacity-30"
                            title="Выдать максимум возможного"
                          >
                            Макс
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetZero(item.itemId)}
                            className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-fill-tertiary hover:bg-fill-secondary text-text-secondary"
                            title="Не выдавать (0)"
                          >
                            0
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Сводный статус выдачи */}
        <div
          className={`p-3.5 rounded-2xl border flex items-start gap-3 text-[12.5px] ${
            isFullFulfillment
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/50 border-amber-200 text-amber-900'
          }`}
        >
          {isFullFulfillment ? (
            <CheckCircle2 className="h-5 w-5 text-macos-green shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-macos-orange shrink-0 mt-0.5" />
          )}

          <div className="leading-relaxed">
            {isFullFulfillment ? (
              <p>
                <strong>Полная выдача:</strong> все запрашиваемые товары ({totalRequested} ед.) будут списаны со склада и выданы заявителю.
              </p>
            ) : (
              <div>
                <p>
                  <strong>Частичная выдача:</strong> будет выдано <strong>{totalIssued}</strong> из <strong>{totalRequested}</strong> запрошенных единиц.
                </p>
                <p className="text-[11.5px] text-amber-700 mt-0.5">
                  Заявка получит статус «Выдано частично», а заявитель увидит точный список выданных и недостающих товаров.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-end gap-2 pt-2 border-t border-separator/60">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loading || totalIssued < 0}
            className={
              isFullFulfillment
                ? 'bg-macos-green hover:bg-macos-green/90 text-white'
                : 'bg-macos-orange hover:bg-macos-orange/90 text-white'
            }
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Оформление...
              </>
            ) : isFullFulfillment ? (
              'Выдать полностью'
            ) : (
              `Оформить частичную выдачу (${totalIssued} ед.)`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
