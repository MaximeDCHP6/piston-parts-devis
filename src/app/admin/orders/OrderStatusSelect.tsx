"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/Field";
import { ORDER_STATUS_LABEL } from "@/lib/status";
import type { OrderStatus } from "@/lib/types/database";
import { updateOrderStatus } from "./actions";

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => startTransition(() => updateOrderStatus(orderId, e.target.value as OrderStatus))}
      className="max-w-[170px]"
    >
      {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
