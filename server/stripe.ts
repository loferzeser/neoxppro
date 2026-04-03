import Stripe from "stripe";
import { ENV } from "./_core/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(ENV.stripeSecretKey);
  }
  return _stripe;
}

export interface CheckoutItem {
  productId: number;
  name: string;
  price: number; // in THB
  quantity: number;
}

export async function createCheckoutSession(params: {
  items: CheckoutItem[];
  orderNumber: string;
  userId: number;
  customerEmail?: string | null;
  customerName?: string | null;
  origin: string;
  /** UI hint; Checkout Session always offers card + PromptPay for THB */
  stripePaymentPreference?: "card" | "promptpay";
}): Promise<string> {
  const stripe = getStripe();

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map((item) => ({
    price_data: {
      currency: "thb",
      product_data: {
        name: item.name,
        metadata: { productId: item.productId.toString() },
      },
      unit_amount: Math.round(item.price * 100), // Stripe uses smallest currency unit (satang)
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "promptpay"],
    line_items: lineItems,
    mode: "payment",
    allow_promotion_codes: true,
    customer_email: params.customerEmail ?? undefined,
    client_reference_id: params.userId.toString(),
    metadata: {
      order_number: params.orderNumber,
      user_id: params.userId.toString(),
      customer_email: params.customerEmail ?? "",
      customer_name: params.customerName ?? "",
      payment_preference: params.stripePaymentPreference ?? "card",
    },
    success_url: `${params.origin}/order-success/${params.orderNumber}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/checkout`,
  });

  return session.url!;
}

export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, ENV.stripeWebhookSecret);
}
