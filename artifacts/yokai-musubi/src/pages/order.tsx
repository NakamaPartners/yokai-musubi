import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useSearch } from "wouter";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import {
  getGetCheckoutSessionQueryKey,
  useCreateCheckoutSession,
  useGetCheckoutSession,
  useGetMenu,
} from "@workspace/api-client-react";
import type { CheckoutInput, MenuItem } from "@workspace/api-client-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { money, useCart } from "@/lib/cart";

function OrderHeader({ cartCount }: { cartCount: number }) {
  return (
    <header className="order-header">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3" data-testid="link-home">
          <img src="/assets/image_1787218194931.png" alt="Yokai Musubi Tengu logo" className="h-11 w-11 object-contain" />
          <span className="font-display text-[15px] font-extrabold tracking-[0.14em]">YOKAI <span className="text-primary">MUSUBI</span></span>
        </Link>
        <Link href="/order/checkout" className="order-cart-link" data-testid="link-cart">
          <ShoppingBag className="h-4 w-4" /> Cart <span>{cartCount}</span>
        </Link>
      </div>
    </header>
  );
}

export default function OrderPage() {
  const cart = useCart();
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [menuBottomVisible, setMenuBottomVisible] = useState(false);
  const menuBottomRef = useRef<HTMLDivElement>(null);
  const menu = useGetMenu();
  useEffect(() => {
    const target = menuBottomRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setMenuBottomVisible(entry.isIntersecting), { rootMargin: "0px 0px 80px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [menu.data]);
  if (menu.isLoading) return <OrderLoading />;
  if (menu.isError || !menu.data) return <OrderUnavailable message="We couldn’t load today’s counter. Please try again, or call (503) 915-7499." />;
  return (
    <div className="order-page min-h-screen bg-background text-foreground">
      <OrderHeader cartCount={cart.count} />
      <main className="mx-auto max-w-[1280px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <div className="order-hero">
          <p className="font-japanese text-sm tracking-[0.24em] text-primary">おむすびを、どうぞ</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <div><h1 className="font-display text-5xl font-extrabold tracking-[-.06em] sm:text-7xl">ORDER <span className="text-primary">AHEAD.</span></h1><p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">Choose your musubi, tell us how you’d like to receive it, and pay securely when the shop is ready for online orders.</p></div>
            <div className={`draft-pill ${menu.data.draft ? "draft-pill-active" : ""}`} data-testid="status-ordering">{menu.data.draft ? "Draft menu · online checkout not enabled" : "Online ordering available"}</div>
          </div>
        </div>
        {menu.data.draft && <div className="draft-callout mt-8" data-testid="status-draft-menu"><AlertCircle className="h-5 w-5 shrink-0" /><p><strong>Menu preview:</strong> item names, availability, prices, delivery rules, and hours are draft configuration until the shop confirms them. Your cart is never submitted while online ordering is off.</p></div>}
        <div className="mt-12 grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-14">
            {menu.data.categories.map((category) => {
              const items = menu.data!.items.filter((item) => item.categoryId === category.id);
              return items.length ? <section key={category.id} aria-labelledby={`category-${category.id}`}>
                <div className="mb-6 flex items-end justify-between border-b border-border pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">The counter</p><h2 id={`category-${category.id}`} className="mt-1 font-display text-3xl font-bold">{category.name}</h2></div><p className="hidden max-w-sm text-right text-sm text-muted-foreground sm:block">{category.description}</p></div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <MenuCard key={item.id} item={item} onCustomize={() => setSelected(item)} />)}</div>
              </section> : null;
            })}
            <div ref={menuBottomRef} className="h-px" aria-hidden="true" />
          </div>
          <CartPanel cart={cart} />
        </div>
      </main>
      <FloatingCart cart={cart} hidden={menuBottomVisible} />
      {selected && <ItemSheet item={selected} onClose={() => setSelected(null)} onAdd={(selections) => { cart.add(selected, selections); setSelected(null); }} />}
    </div>
  );
}

type CartState = ReturnType<typeof useCart>;

function CartPanel({ cart }: { cart: CartState }) {
  return <aside className="order-summary" data-testid="cart-sidebar">
    <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Your order</p><h2 className="mt-1 font-display text-2xl font-bold">Ready when you are.</h2></div><ShoppingBag className="h-5 w-5 text-primary" /></div>
    {cart.items.length ? <><div className="mt-6 divide-y divide-border">{cart.items.map((item) => <CartLine key={item.key} item={item} cart={cart} />)}</div><div className="mt-5 border-t border-foreground pt-5"><div className="flex justify-between text-sm"><span>Subtotal</span><strong>{money(cart.subtotalCents)}</strong></div><Link href="/order/checkout" className="button button-primary mt-5 w-full justify-center" data-testid="button-review-order">Review order <ArrowRight className="h-4 w-4" /></Link></div></> : <div className="mt-10 border-t border-border pt-10 text-center"><ShoppingBag className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-4 font-display text-xl font-bold">Your order is waiting.</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Choose something from the counter and it will appear here.</p></div>}
  </aside>;
}

function CartLine({ item, cart }: { item: CartState["items"][number]; cart: CartState }) {
  return <div className="py-4 first:pt-0"><div className="flex items-start justify-between gap-3"><div><strong className="font-display">{item.name}</strong>{item.modifiers.map((modifier) => <p key={modifier.optionId} className="mt-1 text-xs text-muted-foreground">{modifier.optionName}</p>)}</div><strong className="whitespace-nowrap text-sm">{money(item.unitPriceCents * item.quantity)}</strong></div><div className="mt-3 flex items-center justify-between"><div className="quantity-control"><button type="button" onClick={() => cart.updateQuantity(item.key, item.quantity - 1)} aria-label={`Decrease ${item.name}`} data-testid={`button-decrease-${item.itemId}`}><Minus /></button><span>{item.quantity}</span><button type="button" onClick={() => cart.updateQuantity(item.key, item.quantity + 1)} aria-label={`Increase ${item.name}`} data-testid={`button-increase-${item.itemId}`}><Plus /></button></div><button type="button" className="text-xs font-bold uppercase tracking-widest text-primary" onClick={() => cart.remove(item.key)} data-testid={`button-remove-${item.itemId}`}><Trash2 className="mr-1 inline h-3.5 w-3.5" />Remove</button></div></div>;
}

function FloatingCart({ cart, hidden }: { cart: CartState; hidden: boolean }) {
  if (!cart.items.length || hidden) return null;
  return <div className="floating-cart" data-testid="floating-cart"><div className="flex min-w-0 items-center gap-3"><span className="floating-cart-icon"><ShoppingBag className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-bold">{cart.count} {cart.count === 1 ? "item" : "items"} selected</p><p className="text-xs text-muted-foreground">{money(cart.subtotalCents)} subtotal</p></div></div><Link href="/order/checkout" className="button button-primary shrink-0 px-4 py-3 text-xs" data-testid="button-floating-cart">View order <ArrowRight className="h-4 w-4" /></Link></div>;
}

function MenuCard({ item, onCustomize }: { item: MenuItem; onCustomize: () => void }) {
  return <article className={`menu-card flex h-full flex-col ${!item.available ? "menu-card-unavailable" : ""}`} data-testid={`card-menu-${item.id}`}>
    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-48 w-full shrink-0 object-cover" />}
    <div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-japanese text-xs tracking-[.14em] text-primary">{item.japaneseName}</p><h3 className="mt-1 font-display text-2xl font-bold">{item.name}</h3></div><strong className="whitespace-nowrap text-lg">{money(item.priceCents)}</strong></div><p className="mt-3 min-h-12 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
    {item.modifiers.length > 0 && <p className="mt-3 text-[10px] font-bold uppercase tracking-[.16em] text-primary">Options available</p>}
    <Button type="button" onClick={onCustomize} disabled={!item.available} className="mt-auto w-full" data-testid={`button-add-${item.id}`}>{item.available ? item.modifiers.length ? "Choose options" : "Add to cart" : "Sold out"}</Button></div>
  </article>;
}

function ItemSheet({ item, onClose, onAdd }: { item: MenuItem; onClose: () => void; onAdd: (selections: Record<string, string>) => void }) {
  const [selections, setSelections] = useState<Record<string, string>>(() => Object.fromEntries(item.modifiers.filter((group) => group.options.length === 1).map((group) => [group.id, group.options[0].id])));
  const missingRequired = item.modifiers.some((group) => group.required && !selections[group.id]);
  const extra = item.modifiers.reduce((sum, group) => sum + (group.options.find((option) => option.id === selections[group.id])?.priceCents ?? 0), 0);
  return <div className="fixed inset-0 z-[100] flex items-end bg-foreground/50 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Customize ${item.name}`}>
    <div className="w-full max-w-xl bg-background shadow-2xl"><div className="flex items-start justify-between border-b border-border p-6"><div><p className="font-japanese text-xs tracking-[.16em] text-primary">カスタマイズ</p><h2 className="mt-1 font-display text-3xl font-bold">{item.name}</h2></div><button type="button" onClick={onClose} className="text-sm font-bold uppercase tracking-widest text-muted-foreground" data-testid="button-close-customize">Close</button></div>
    <div className="max-h-[55vh] overflow-y-auto p-6">{item.modifiers.length ? item.modifiers.map((group) => <fieldset key={group.id} className="mb-7"><legend className="font-display text-lg font-bold">{group.name} {group.required && <span className="text-primary">*</span>}</legend><div className="mt-3 grid gap-2">{group.options.map((option) => <label key={option.id} className={`modifier-option ${selections[group.id] === option.id ? "modifier-option-selected" : ""}`}><input className="sr-only" type="radio" name={group.id} checked={selections[group.id] === option.id} onChange={() => setSelections((current) => ({ ...current, [group.id]: option.id }))} data-testid={`input-modifier-${option.id}`} /><span>{option.name}</span><span>{option.priceCents ? `+${money(option.priceCents)}` : "Included"}</span></label>)}</div></fieldset>) : <p className="text-muted-foreground">No substitutions or add-ons for this item.</p>}</div>
    <div className="flex items-center justify-between border-t border-border p-6"><div><p className="text-xs uppercase tracking-[.16em] text-muted-foreground">Item total</p><strong className="font-display text-2xl">{money(item.priceCents + extra)}</strong></div><Button type="button" disabled={missingRequired} onClick={() => onAdd(selections)} data-testid="button-confirm-add">Add to cart <Plus className="h-4 w-4" /></Button></div></div>
  </div>;
}

type CheckoutForm = { name: string; phone: string; fulfillment: "pickup" | "delivery"; scheduledFor: string; address: string; city: string; state: string; zip: string; notes: string };

export function CheckoutPage() {
  const cart = useCart();
  const menu = useGetMenu();
  const checkout = useCreateCheckoutSession();
  const form = useForm<CheckoutForm>({ defaultValues: { name: "", phone: "", fulfillment: "pickup", scheduledFor: "", address: "", city: "Portland", state: "OR", zip: "", notes: "" } });
  const fulfillment = form.watch("fulfillment");
  const settings = menu.data?.fulfillment;
  const deliveryFee = fulfillment === "delivery" ? settings?.deliveryFeeCents ?? 0 : 0;
  const tax = Math.round(cart.subtotalCents * (settings?.taxRate ?? 0));
  const total = cart.subtotalCents + tax + deliveryFee;
  const submit = (values: CheckoutForm) => {
    if (!cart.items.length) return;
    const input: CheckoutInput = {
      items: cart.items.map((item) => ({ itemId: item.itemId, quantity: item.quantity, modifiers: item.modifiers.map((modifier) => ({ groupId: modifier.groupId, optionId: modifier.optionId })) })),
      customer: { name: values.name, phone: values.phone },
      fulfillment: { type: values.fulfillment, scheduledFor: values.scheduledFor ? new Date(values.scheduledFor).toISOString() : null, address: values.fulfillment === "delivery" ? values.address : null, city: values.fulfillment === "delivery" ? values.city : null, state: values.fulfillment === "delivery" ? values.state : null, zip: values.fulfillment === "delivery" ? values.zip : null },
      notes: values.notes || null,
    };
    checkout.mutate({ data: input }, { onSuccess: (response) => {
      sessionStorage.setItem(`checkout:${response.providerSessionId}`, JSON.stringify({
        checkoutSessionId: response.checkoutSessionId,
        confirmationToken: response.confirmationToken,
      }));
      window.location.assign(response.checkoutUrl);
    } });
  };
  if (menu.isLoading) return <OrderLoading />;
  if (!cart.items.length) return <div className="min-h-screen bg-background"><OrderHeader cartCount={0} /><main className="mx-auto max-w-xl px-5 py-24 text-center"><ShoppingBag className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 font-display text-4xl font-bold">Your cart is empty.</h1><p className="mt-3 text-muted-foreground">Start at the counter and pick something for the road.</p><Link href="/order" className="button button-primary mt-7 px-5 py-3" data-testid="link-return-menu">Browse the menu <ArrowRight className="h-4 w-4" /></Link></main></div>;
  return <div className="min-h-screen bg-background"><OrderHeader cartCount={cart.count} /><main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8"><Link href="/order" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-primary" data-testid="link-back-menu"><ArrowLeft className="h-4 w-4" /> Back to menu</Link><div className="mt-7 grid gap-10 lg:grid-cols-[1fr_380px]"><div><p className="font-japanese text-sm tracking-[.2em] text-primary">お会計</p><h1 className="mt-2 font-display text-5xl font-extrabold tracking-[-.06em]">CHECKOUT.</h1>
  <Form {...form}><form onSubmit={form.handleSubmit(submit)} className="mt-8 space-y-8"><section className="checkout-panel"><h2 className="font-display text-2xl font-bold">Your details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Name"><Input {...form.register("name", { required: true })} data-testid="input-customer-name" /></Field><Field label="Phone"><Input {...form.register("phone", { required: true })} data-testid="input-customer-phone" /></Field></div></section>
  <section className="checkout-panel"><h2 className="font-display text-2xl font-bold">Receive your order</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className={`fulfillment-choice ${fulfillment === "pickup" ? "fulfillment-choice-selected" : ""}`}><input className="sr-only" type="radio" value="pickup" {...form.register("fulfillment")} data-testid="input-fulfillment-pickup" /><ShoppingBag className="h-5 w-5" /><span><strong>Pickup</strong><small>At our West Burnside counter</small></span></label><label className={`fulfillment-choice ${fulfillment === "delivery" ? "fulfillment-choice-selected" : ""}`}><input className="sr-only" type="radio" value="delivery" {...form.register("fulfillment")} disabled={!settings?.deliveryEnabled} data-testid="input-fulfillment-delivery" /><Truck className="h-5 w-5" /><span><strong>Local delivery</strong><small>{settings?.deliveryEnabled ? "Within confirmed delivery zones" : "Not configured yet"}</small></span></label></div>
  <div className="mt-5"><Field label="Pickup or delivery time (optional)"><Input type="datetime-local" {...form.register("scheduledFor")} data-testid="input-scheduled-time" /></Field></div>
  {fulfillment === "delivery" && <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Street address" className="sm:col-span-2"><Input {...form.register("address", { required: true })} data-testid="input-address" /></Field><Field label="City"><Input {...form.register("city", { required: true })} data-testid="input-city" /></Field><Field label="ZIP code"><Input {...form.register("zip", { required: true })} data-testid="input-zip" /></Field></div>}</section>
  <section className="checkout-panel"><h2 className="font-display text-2xl font-bold">A note for the counter</h2><Textarea className="mt-5" placeholder="Allergy note, parking note, or anything else we should know." {...form.register("notes")} data-testid="input-order-notes" /></section>
  {checkout.isError && <div className="draft-callout"><AlertCircle className="h-5 w-5 shrink-0" /><p>{checkout.error instanceof Error ? checkout.error.message : "Checkout could not start. No order was created."}</p></div>}
  <Button type="submit" className="w-full py-6 text-base" disabled={checkout.isPending || !menu.data?.orderingEnabled} data-testid="button-secure-checkout">{checkout.isPending ? "Preparing secure checkout…" : menu.data?.orderingEnabled ? "Continue to secure payment" : "Online ordering not enabled" }<ArrowRight className="h-5 w-5" /></Button>
  <p className="text-center text-xs leading-relaxed text-muted-foreground">Payment is handled by Stripe Checkout. Yokai Musubi never receives or stores your card details. A paid confirmation only appears after Stripe verifies payment.</p></form></Form></div>
  <aside className="order-summary"><h2 className="font-display text-2xl font-bold">Your order</h2><div className="mt-5 divide-y divide-border">{cart.items.map((item) => <div key={item.key} className="py-4"><div className="flex justify-between gap-3"><div><strong>{item.name}</strong>{item.modifiers.map((modifier) => <p key={modifier.optionId} className="text-xs text-muted-foreground">{modifier.groupName}: {modifier.optionName}</p>)}</div><strong>{money(item.unitPriceCents * item.quantity)}</strong></div><div className="mt-3 flex items-center justify-between"><div className="quantity-control"><button type="button" onClick={() => cart.updateQuantity(item.key, item.quantity - 1)} data-testid={`button-decrease-${item.itemId}`}><Minus /></button><span>{item.quantity}</span><button type="button" onClick={() => cart.updateQuantity(item.key, item.quantity + 1)} data-testid={`button-increase-${item.itemId}`}><Plus /></button></div><button type="button" className="text-xs font-bold uppercase tracking-widest text-primary" onClick={() => cart.remove(item.key)} data-testid={`button-remove-${item.itemId}`}><Trash2 className="mr-1 inline h-3.5 w-3.5" />Remove</button></div></div>)}</div><Totals subtotal={cart.subtotalCents} tax={tax} fee={deliveryFee} total={total} /></aside></div></main></div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`grid gap-2 text-sm font-bold ${className}`}><span>{label}</span>{children}</label>; }
function Totals({ subtotal, tax, fee, total }: { subtotal: number; tax: number; fee: number; total: number }) { return <div className="mt-5 border-t border-foreground pt-5 text-sm"><div className="flex justify-between py-1"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between py-1"><span>Tax</span><span>{money(tax)}</span></div><div className="flex justify-between py-1"><span>Delivery</span><span>{fee ? money(fee) : "—"}</span></div><div className="mt-3 flex justify-between text-xl font-bold"><span>Total</span><span>{money(total)}</span></div></div>; }
function OrderLoading() { return <div className="grid min-h-screen place-items-center bg-background"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" /><p className="mt-4 text-sm font-bold uppercase tracking-[.18em] text-muted-foreground">Setting the counter</p></div></div>; }
function OrderUnavailable({ message }: { message: string }) { return <div className="grid min-h-screen place-items-center bg-background p-6 text-center"><div><AlertCircle className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 font-display text-4xl font-bold">Not quite ready.</h1><p className="mt-3 max-w-lg text-muted-foreground">{message}</p><Link href="/" className="button button-primary mt-7 px-5 py-3">Return home</Link></div></div>; }

export function ConfirmationPage() {
  const search = useSearch();
  const providerSessionId = new URLSearchParams(search).get("session_id") ?? "";
  const [storedSession] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`checkout:${providerSessionId}`);
      return stored ? JSON.parse(stored) as { checkoutSessionId: string; confirmationToken: string } : null;
    } catch {
      return null;
    }
  });
  const sessionId = storedSession?.checkoutSessionId ?? "";
  const query = useGetCheckoutSession(sessionId, { query: { enabled: Boolean(sessionId), queryKey: getGetCheckoutSessionQueryKey(sessionId), refetchInterval: 2500 }, request: { headers: storedSession ? { "x-confirmation-token": storedSession.confirmationToken } : undefined } });
  if (!storedSession) return <OrderUnavailable message="For privacy, reopen this confirmation in the same browser session used for checkout. Keep any payment receipt shown by Stripe for your records." />;
  if (query.isLoading) return <OrderLoading />;
  if (query.isError || !query.data) return <OrderUnavailable message="We couldn’t verify that payment session. If Stripe showed a receipt, please call the shop with it." />;
  const paid = query.data.status === "paid";
  return <div className="min-h-screen bg-background"><OrderHeader cartCount={0} /><main className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">{paid ? <><CheckCircle2 className="mx-auto h-14 w-14 text-primary" /><p className="mt-6 font-japanese text-sm tracking-[.2em] text-primary">ありがとうございます</p><h1 className="mt-2 font-display text-5xl font-extrabold tracking-[-.06em]">ORDER <span className="text-primary">RECEIVED.</span></h1><p className="mt-5 text-lg text-muted-foreground">Thanks — payment is verified and the counter has your order.</p><div className="confirmation-card mt-9 text-left"><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Order number</p><p className="mt-1 font-display text-3xl font-bold">{(query.data.order as { orderNumber?: string } | null)?.orderNumber ?? "Confirmed"}</p><div className="mt-6 border-t border-border pt-5"><p className="font-bold">{query.data.fulfillment?.type === "delivery" ? "Local delivery" : "Pickup at Yokai Musubi"}</p><p className="mt-1 text-sm text-muted-foreground">{query.data.fulfillment?.scheduledFor ? `Scheduled for ${new Date(query.data.fulfillment.scheduledFor).toLocaleString()}` : "We’ll prepare it as soon as we can. Please allow the configured lead time."}</p></div><Totals subtotal={query.data.totals.subtotalCents} tax={query.data.totals.taxCents} fee={query.data.totals.deliveryFeeCents} total={query.data.totals.totalCents} /></div></> : <><Clock3 className="mx-auto h-14 w-14 text-primary" /><p className="mt-6 font-japanese text-sm tracking-[.2em] text-primary">確認中</p><h1 className="mt-2 font-display text-5xl font-extrabold tracking-[-.06em]">CONFIRMING <span className="text-primary">PAYMENT.</span></h1><p className="mt-5 text-lg text-muted-foreground">Stripe sent you back successfully. We’re waiting for the verified payment event before confirming an order. This page updates automatically.</p></>}<Link href="/order" className="button button-outline mt-10 px-5 py-3" data-testid="link-order-more">Order something else</Link></main></div>;
}