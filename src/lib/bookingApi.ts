export type BookingPayload = {
  slotId: string;
  adventureId?: string | null;
  tier: "standard" | "premium";
  players: number;
  name: string;
  contact: string;
  email?: string;
  comment?: string;
  needsStorySuggestion?: boolean;
};

export type BookingResponse = {
  bookingId: string;
};

export type PaymentResponse = {
  paymentUrl: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function createBooking(payload: BookingPayload): Promise<BookingResponse> {
  await sleep(700);
  return { bookingId: `mock_${payload.slotId}_${Date.now()}` };
}

export async function createPayment(bookingId: string): Promise<PaymentResponse> {
  await sleep(600);
  return { paymentUrl: `/schedule?payment=success&bookingId=${bookingId}` };
}
