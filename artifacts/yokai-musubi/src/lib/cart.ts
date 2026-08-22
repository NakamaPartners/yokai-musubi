import { useEffect, useMemo, useState } from "react";
import type { MenuItem } from "@workspace/api-client-react";

export type CartItem = {
  key: string;
  itemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  modifiers: Array<{ groupId: string; optionId: string; groupName: string; optionName: string; priceCents: number }>;
};

const STORAGE_KEY = "yokai-order-cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as CartItem[] : [];
  } catch {
    return [];
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  return useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
    add(item: MenuItem, selections: Record<string, string>) {
      const modifiers = item.modifiers.flatMap((group) => {
        const option = group.options.find((candidate) => candidate.id === selections[group.id]);
        return option ? [{ groupId: group.id, optionId: option.id, groupName: group.name, optionName: option.name, priceCents: option.priceCents }] : [];
      });
      const key = `${item.id}:${modifiers.map((modifier) => `${modifier.groupId}-${modifier.optionId}`).sort().join("|")}`;
      const unitPriceCents = item.priceCents + modifiers.reduce((sum, modifier) => sum + modifier.priceCents, 0);
      setItems((previous) => {
        const existing = previous.find((entry) => entry.key === key);
        return existing
          ? previous.map((entry) => entry.key === key ? { ...entry, quantity: Math.min(entry.quantity + 1, 20) } : entry)
          : [...previous, { key, itemId: item.id, name: item.name, quantity: 1, unitPriceCents, modifiers }];
      });
    },
    updateQuantity(key: string, quantity: number) {
      setItems((previous) => quantity <= 0 ? previous.filter((item) => item.key !== key) : previous.map((item) => item.key === key ? { ...item, quantity: Math.min(quantity, 20) } : item));
    },
    remove(key: string) {
      setItems((previous) => previous.filter((item) => item.key !== key));
    },
    clear() {
      setItems([]);
    },
  }), [items]);
}

export function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}