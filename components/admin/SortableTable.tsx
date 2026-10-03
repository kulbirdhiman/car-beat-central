"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useId } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

/** Rows only move up and down. */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/**
 * A table whose rows can be reordered by dragging the grip handle (mouse, touch or keyboard:
 * focus the handle, press Space, move with the arrow keys, Space again to drop).
 */
export function SortableTable<T extends { id: string }>({
  rows,
  columns,
  onReorder,
  rowLabel,
}: {
  rows: T[];
  columns: Column<T>[];
  /** Receives the rows in their new order. */
  onReorder: (rows: T[]) => void;
  /** Name of a row, used in screen reader announcements and the handle's label. */
  rowLabel: (row: T) => string;
}) {
  // A stable id keeps dnd-kit's generated aria attributes identical on server and client.
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const labelOf = (rowId: string | number) => {
    const row = rows.find((r) => r.id === rowId);
    return row ? rowLabel(row) : String(rowId);
  };
  const positionOf = (rowId: string | number) => rows.findIndex((r) => r.id === rowId) + 1;

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = rows.findIndex((r) => r.id === active.id);
    const to = rows.findIndex((r) => r.id === over.id);
    if (from !== -1 && to !== -1) onReorder(arrayMove(rows, from, to));
  }

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[verticalOnly]}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up ${labelOf(active.id)}, position ${positionOf(active.id)} of ${rows.length}.`,
          onDragOver: ({ active, over }) => (over ? `${labelOf(active.id)} is over position ${positionOf(over.id)} of ${rows.length}.` : undefined),
          onDragEnd: ({ active, over }) => (over ? `Dropped ${labelOf(active.id)} at position ${positionOf(over.id)} of ${rows.length}.` : `Dropped ${labelOf(active.id)}.`),
          onDragCancel: ({ active }) => `Cancelled. ${labelOf(active.id)} returned to its place.`,
        },
      }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <span className="sr-only">Reorder</span>
            </TableHead>
            {columns.map((c, i) => (
              <TableHead key={i} className={c.className}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            {rows.map((row) => (
              <SortableRow key={row.id} row={row} columns={columns} label={rowLabel(row)} />
            ))}
          </SortableContext>
        </TableBody>
      </Table>
    </DndContext>
  );
}

function SortableRow<T extends { id: string }>({ row, columns, label }: { row: T; columns: Column<T>[]; label: string }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "relative z-10 bg-background shadow-lg ring-1 ring-foreground/10")}
    >
      <TableCell className="w-10">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="flex size-7 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label={`Drag to reorder ${label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      {columns.map((c, i) => (
        <TableCell key={i} className={c.className}>
          {c.cell(row)}
        </TableCell>
      ))}
    </TableRow>
  );
}
