"use client";

import { useState } from "react";
import { getLocationPath } from "@/core/location";
import type { ItemInput, Location } from "@/core/types";

interface Props {
  locations: Location[];
  initial: ItemInput;
  submitLabel: string;
  onSubmit: (input: ItemInput) => Promise<void>;
}

// <input type="date">는 YYYY-MM-DD, 저장은 ISO
const toDateInput = (iso?: string) => iso?.slice(0, 10) ?? "";
const toIso = (date: string) => new Date(date).toISOString();

const field = "flex flex-col gap-1";
const input =
  "min-h-11 w-full min-w-0 rounded-lg border border-zinc-300 px-3 text-base";

export default function ItemForm({
  locations,
  initial,
  submitLabel,
  onSubmit,
}: Props) {
  const [form, setForm] = useState({
    ...initial,
    quantity: String(initial.quantity),
    purchasedAt: toDateInput(initial.purchasedAt),
    expiresAt: toDateInput(initial.expiresAt),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm({ ...form, [key]: e.target.value });

  const options = locations
    .map((l) => ({ id: l.id, path: getLocationPath(locations, l.id) }))
    .sort((a, b) => a.path.localeCompare(b.path));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        name: form.name.trim(),
        category: form.category.trim(),
        locationId: form.locationId,
        quantity: Number(form.quantity),
        unit: form.unit.trim(),
        purchasedAt: toIso(form.purchasedAt),
        expiresAt: form.expiresAt ? toIso(form.expiresAt) : undefined,
        memo: form.memo.trim(),
      });
    } catch (err) {
      setError(`저장하지 못했습니다. 다시 시도해 주세요. (${String(err)})`);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <label className={field}>
        이름 *
        <input
          className={input}
          value={form.name}
          onChange={set("name")}
          required
          autoFocus
        />
      </label>
      <label className={field}>
        위치 *
        <select
          className={input}
          value={form.locationId}
          onChange={set("locationId")}
          required
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.path}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-3">
        <label className={`${field} min-w-0 flex-1`}>
          수량 *
          <input
            className={input}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={form.quantity}
            onChange={set("quantity")}
            required
          />
        </label>
        <label className={`${field} min-w-0 flex-1`}>
          단위
          <input
            className={input}
            value={form.unit}
            onChange={set("unit")}
            placeholder="개, 롤, 팩"
          />
        </label>
      </div>
      <label className={field}>
        분류
        <input
          className={input}
          value={form.category}
          onChange={set("category")}
          placeholder="생활용품, 식품"
        />
      </label>
      <label className={field}>
        입고일 *
        <input
          className={input}
          type="date"
          value={form.purchasedAt}
          onChange={set("purchasedAt")}
          required
        />
      </label>
      <label className={field}>
        유통기한 (선택)
        <input
          className={input}
          type="date"
          value={form.expiresAt}
          onChange={set("expiresAt")}
        />
      </label>
      <label className={field}>
        메모
        <textarea
          className={`${input} py-2`}
          rows={3}
          value={form.memo}
          onChange={set("memo")}
        />
      </label>
      {error && (
        <p role="alert" className="text-red-700">
          ⚠ {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="min-h-11 rounded-lg bg-zinc-900 font-semibold text-white disabled:opacity-50"
      >
        {saving ? "저장 중…" : submitLabel}
      </button>
    </form>
  );
}
