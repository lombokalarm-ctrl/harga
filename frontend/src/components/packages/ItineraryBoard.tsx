import { GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ItineraryDay } from "@/types/domain";

export function ItineraryBoard({
  items,
  onMove,
  onChange,
}: {
  items: ItineraryDay[];
  onMove: (from: number, to: number) => void;
  onChange: (index: number, patch: Partial<ItineraryDay>) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item, index) => (
        <Card
          key={`${item.hari_ke}-${item.judul}`}
          className="cursor-move"
          draggable
          onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const from = Number(event.dataTransfer.getData("text/plain"));
            onMove(from, index);
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-gold-600 dark:text-gold-300">Hari {item.hari_ke}</p>
              <input
                value={item.judul}
                onChange={(event) => onChange(index, { judul: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 font-serif text-lg dark:border-white/10"
              />
              <textarea
                value={item.deskripsi}
                onChange={(event) => onChange(index, { deskripsi: event.target.value })}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300"
              />
            </div>
            <GripVertical className="mt-1 h-5 w-5 text-slate-400" />
          </div>
        </Card>
      ))}
    </div>
  );
}
