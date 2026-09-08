// src/components/dashboard/widgets/InventoryRiskWidget.tsx
import { AlertTriangle, Package } from 'lucide-react';

interface RiskItem {
  id: string;
  name: string;
  currentQty: number;
  minQty: number;
  unit: string;
  daysLeft: number;
}

interface InventoryRiskData {
  critical: RiskItem[];
  warning: RiskItem[];
  totalLow: number;
}

export default function InventoryRiskWidget({ data }: { data: InventoryRiskData | undefined }) {
  if (!data) return null;

  const items = [...(data.critical ?? []), ...(data.warning ?? [])].slice(0, 7);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Top summary card */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[20px] font-black text-amber-700 dark:text-amber-300 leading-none tabular-nums">
              {data.totalLow}
            </span>
            <p className="text-[11px] font-medium text-amber-800/80 dark:text-amber-200">
              позиций с низким запасом
            </p>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="flex flex-col gap-1.5 flex-1">
        {items.length === 0 ? (
          <div className="p-4 text-center text-text-tertiary text-[12px] my-auto">
            Все запасы на складе в пределах нормы
          </div>
        ) : (
          items.map(item => {
            const ratio = Math.min(item.currentQty / Math.max(item.minQty, 1), 1);
            const isCritical = item.daysLeft <= 2;
            return (
              <div
                key={item.id}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/30 text-[12px]"
              >
                <Package className={`h-3.5 w-3.5 shrink-0 ${isCritical ? 'text-rose-500' : 'text-amber-500'}`} />
                <span className="flex-1 truncate font-medium text-text-primary text-[11px]">
                  {item.name}
                </span>
                <div className="w-14 h-1.5 bg-fill-quaternary dark:bg-slate-700/50 rounded-full overflow-hidden shrink-0">
                  <div
                    className={`h-full rounded-full ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.max(ratio * 100, 5)}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold tabular-nums text-text-secondary w-16 text-right shrink-0">
                  {item.currentQty} {item.unit}
                </span>
              </div>
            );
          })
        )}
      </div>

      {data.totalLow > 7 && (
        <p className="text-[10px] text-text-tertiary text-center pt-0.5">
          ещё {data.totalLow - 7} позиций на складе…
        </p>
      )}
    </div>
  );
}
