"use client";

import { type ReactNode } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Separate drag handles keep text fields usable with a mouse, touch, and keyboard. */
export function SortableList<T extends { id: string }>({ items, onChange, label, children }: {
  items: T[]; onChange: (items: T[]) => void; label: (item: T, index: number) => string;
  children: (item: T, index: number, handle: ReactNode) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
      if (!over || active.id === over.id) return;
      const from = items.findIndex((item) => item.id === active.id);
      const to = items.findIndex((item) => item.id === over.id);
      if (from >= 0 && to >= 0) onChange(arrayMove(items, from, to));
    }}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => (
          <SortableItem key={item.id} id={item.id} label={label(item, index)}>
            {(handle) => children(item, index, handle)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, label, children }: { id: string; label: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? "relative z-10 rounded-lg bg-background opacity-80 shadow-lg" : undefined}>
      {children(
        <Button type="button" variant="ghost" size="icon-sm" className="touch-none cursor-grab active:cursor-grabbing" aria-label={`Reorder ${label}`} title="Drag to reorder, or press Space and use arrow keys" {...attributes} {...listeners}>
          <GripVertical />
        </Button>,
      )}
    </div>
  );
}
