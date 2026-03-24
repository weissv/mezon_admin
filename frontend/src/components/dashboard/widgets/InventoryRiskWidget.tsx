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

  const items = [...data.critical, ...data.warning].slice(0, 6);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span className="font-medium">{data.totalLow} позиций с низким запасом</span>
      </div>

      <div className="space-y-1.5">
        {items.map(item => {
          const ratio = Math.min(item.currentQty / Math.max(item.minQty, 1), 1);
          const isCritical = item.daysLeft <= 2;
          return (
            <div key={item.id} className="flex items-center gap-2 text-xs">
              <Package className={`h-3 w-3 flex-shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
              <span className="truncate flex-1">{item.name}</span>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-400'}`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
              <span className="text-gray-400 w-14 text-right">
                {item.currentQty} {item.unit}
              </span>
            </div>
          );
        })}
      </div>

      {data.totalLow > 6 && (
        <p className="text-xs text-gray-400 text-center">ещё {data.totalLow - 6} позиций…</p>
      )}
    </div>
  );
}
