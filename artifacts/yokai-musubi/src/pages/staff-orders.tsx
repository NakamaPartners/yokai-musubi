import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList, KeyRound, Loader2, Save, Settings2 } from "lucide-react";
import {
  getGetStaffOrdersQueryKey,
  getGetStaffSettingsQueryKey,
  useGetStaffOrders,
  useGetStaffSettings,
  useUpdateStaffOrder,
  useUpdateStaffSettings,
} from "@workspace/api-client-react";
import type { FulfillmentSettings, StaffOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/cart";

const statuses = ["accepted", "preparing", "ready", "completed", "cancelled"] as const;

export default function StaffOrdersPage() {
  const [key, setKey] = useState(() => sessionStorage.getItem("yokai-staff-key") ?? "");
  const [draftKey, setDraftKey] = useState(key);
  const headers = key ? { "x-staff-key": key } : undefined;
  const settings = useGetStaffSettings({ query: { enabled: Boolean(key), queryKey: getGetStaffSettingsQueryKey() }, request: { headers } });
  const orders = useGetStaffOrders(undefined, { query: { enabled: Boolean(key), queryKey: getGetStaffOrdersQueryKey() }, request: { headers } });
  const setAccess = () => { sessionStorage.setItem("yokai-staff-key", draftKey); setKey(draftKey); };
  return <div className="min-h-screen bg-background text-foreground"><header className="order-header"><div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8"><a href="/" className="font-display text-lg font-extrabold tracking-[.14em]" data-testid="link-staff-home">YOKAI <span className="text-primary">MUSUBI</span></a><span className="text-xs font-bold uppercase tracking-[.16em] text-primary">Staff order desk</span></div></header>
    <main className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8"><p className="font-japanese text-sm tracking-[.2em] text-primary">お店の管理</p><h1 className="mt-2 font-display text-5xl font-extrabold tracking-[-.06em]">ORDER <span className="text-primary">DESK.</span></h1><p className="mt-4 max-w-2xl text-muted-foreground">Use the staff access key to see verified incoming orders and finalize the draft ordering configuration. The key is kept only for this browser session.</p>
      <form className="staff-access mt-8" onSubmit={(event) => { event.preventDefault(); setAccess(); }}><KeyRound className="h-5 w-5 text-primary" /><Input value={draftKey} onChange={(event) => setDraftKey(event.target.value)} type="password" autoComplete="new-password" placeholder="Staff access key" data-testid="input-staff-key" /><Button type="submit" data-testid="button-unlock-staff">Open desk</Button></form>
      {!key ? <StaffHint /> : <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_.8fr]"><section><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Incoming orders</p><h2 className="mt-1 font-display text-3xl font-bold">The queue</h2></div><ClipboardList className="h-6 w-6 text-primary" /></div>{orders.isLoading ? <div className="staff-empty"><Loader2 className="h-7 w-7 animate-spin text-primary" />Loading orders…</div> : orders.isError ? <div className="staff-empty">The access key was not accepted, or orders are temporarily unavailable.</div> : <OrderQueue orders={orders.data?.orders ?? []} staffKey={key} />}</section><section><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Launch configuration</p><h2 className="mt-1 font-display text-3xl font-bold">Fulfillment settings</h2></div>{settings.isLoading ? <div className="staff-empty"><Loader2 className="h-7 w-7 animate-spin text-primary" />Loading settings…</div> : settings.isError || !settings.data ? <div className="staff-empty">Settings are locked until a valid staff key is entered.</div> : <SettingsEditor initial={settings.data} staffKey={key} />}</section></div>}
    </main></div>;
}

function StaffHint() { return <div className="staff-empty mt-10"><Settings2 className="h-9 w-9 text-primary" /><p className="font-display text-2xl font-bold">Protected staff area</p><p className="max-w-md text-center text-sm text-muted-foreground">This desk does not use a shared customer link. Configure <code>STAFF_ACCESS_KEY</code> in secrets, then enter it above to view paid orders and enable online ordering.</p></div>; }
function OrderQueue({ orders, staffKey }: { orders: StaffOrder[]; staffKey: string }) {
  const client = useQueryClient();
  const update = useUpdateStaffOrder({ request: { headers: { "x-staff-key": staffKey } }, mutation: { onSuccess: () => { client.invalidateQueries({ queryKey: getGetStaffOrdersQueryKey() }); } } });
  if (!orders.length) return <div className="staff-empty"><ClipboardList className="h-9 w-9 text-primary" /><p className="font-display text-2xl font-bold">No verified orders yet.</p><p className="text-center text-sm text-muted-foreground">Orders appear here only after Stripe’s webhook verifies payment.</p></div>;
  return <div className="mt-6 grid gap-4">{orders.map((order) => <article key={order.id} className="staff-order"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-primary">{order.orderNumber}</p><h3 className="mt-1 font-display text-xl font-bold">{order.customer.name}</h3><p className="mt-1 text-sm text-muted-foreground">{order.fulfillment.type === "delivery" ? "Local delivery" : "Pickup"} · {money((order as unknown as { totalCents: number }).totalCents)}</p></div><span className={`status-chip status-${order.status}`}>{order.status}</span></div><div className="mt-4 flex flex-wrap gap-2">{statuses.map((status) => <button key={status} type="button" className={`status-button ${order.status === status ? "status-button-active" : ""}`} disabled={update.isPending || order.status === status} onClick={() => update.mutate({ orderId: order.id ?? "", data: { status } })} data-testid={`button-status-${order.id}-${status}`}>{status}</button>)}</div></article>)}</div>;
}

function SettingsEditor({ initial, staffKey }: { initial: FulfillmentSettings; staffKey: string }) {
  const client = useQueryClient();
  const [settings, setSettings] = useState(initial);
  const update = useUpdateStaffSettings({ request: { headers: { "x-staff-key": staffKey } }, mutation: { onSuccess: () => { client.invalidateQueries({ queryKey: getGetStaffSettingsQueryKey() }); } } });
  const change = <K extends keyof FulfillmentSettings>(key: K, value: FulfillmentSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  return <div className="mt-6 checkout-panel"><label className="settings-switch"><input type="checkbox" checked={settings.orderingEnabled} onChange={(event) => change("orderingEnabled", event.target.checked)} data-testid="input-ordering-enabled" /><span><strong>Enable online ordering</strong><small>Only turn this on after menu, tax, hours, delivery, and Stripe are confirmed.</small></span></label><label className="settings-switch"><input type="checkbox" checked={settings.pickupEnabled} onChange={(event) => change("pickupEnabled", event.target.checked)} data-testid="input-pickup-enabled" /><span><strong>Offer pickup</strong><small>Current draft shop hours remain visible to customers.</small></span></label><label className="settings-switch"><input type="checkbox" checked={settings.deliveryEnabled} onChange={(event) => change("deliveryEnabled", event.target.checked)} data-testid="input-delivery-enabled" /><span><strong>Offer local delivery</strong><small>Add confirmed ZIP zones before enabling.</small></span></label><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Tax rate <Input type="number" min="0" max="1" step=".001" value={settings.taxRate} onChange={(event) => change("taxRate", Number(event.target.value))} data-testid="input-tax-rate" /></label><label className="grid gap-2 text-sm font-bold">Lead time (minutes)<Input type="number" min="0" value={settings.leadTimeMinutes} onChange={(event) => change("leadTimeMinutes", Number(event.target.value))} data-testid="input-lead-time" /></label><label className="grid gap-2 text-sm font-bold">Delivery fee (¢)<Input type="number" min="0" value={settings.deliveryFeeCents} onChange={(event) => change("deliveryFeeCents", Number(event.target.value))} data-testid="input-delivery-fee" /></label><label className="grid gap-2 text-sm font-bold">Delivery minimum (¢)<Input type="number" min="0" value={settings.deliveryMinimumCents} onChange={(event) => change("deliveryMinimumCents", Number(event.target.value))} data-testid="input-delivery-minimum" /></label></div><Button type="button" className="mt-6 w-full" disabled={update.isPending} onClick={() => update.mutate({ data: settings })} data-testid="button-save-settings"><Save className="h-4 w-4" />{update.isPending ? "Saving…" : "Save configuration"}</Button>{update.isError && <p className="mt-3 text-sm text-destructive">Could not save the configuration. Check the staff key and try again.</p>}</div>;
}