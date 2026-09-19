import { HttpError } from '../../utils/httpError.js';

/**
 * STUB for a real Tanzanian payment aggregator (Selcom, AzamPay, ClickPesa, ...).
 * Selected with PAYMENT_DRIVER=gateway. Not connected yet.
 *
 * To wire a real gateway:
 *
 *  1. Add its credentials to server/.env (see the commented GATEWAY_* lines in
 *     .env.example) and read them in src/config/env.js.
 *
 *  2. In `initiate(order)` below, send the STK-push / USSD-push request:
 *
 *       // TODO(gateway): STK-push HTTP call goes here.
 *       // const res = await fetch(env.GATEWAY_API_URL, {
 *       //   method: 'POST',
 *       //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GATEWAY_SECRET_KEY}` },
 *       //   body: JSON.stringify({
 *       //     amount: order.amount,               // always the server-computed amount
 *       //     currency: 'TZS',
 *       //     msisdn: '255' + order.paymentPhone.slice(1),
 *       //     provider: order.provider,           // tigopesa | mpesa | airtel | halopesa
 *       //     reference: order.reference,         // HLY-TZ-12345, echoed back in the webhook
 *       //     callbackUrl: env.GATEWAY_CALLBACK_URL, // -> POST /api/payments/webhook
 *       //   }),
 *       //   signal: AbortSignal.timeout(20000),
 *       // });
 *       // if (!res.ok) throw new HttpError(502, 'Imeshindikana kutuma ombi la malipo. Jaribu tena.');
 *       // const data = await res.json();
 *       // return { gatewayRef: String(data.transactionId) };
 *
 *  3. The gateway reports the result to POST /api/payments/webhook
 *     (src/routes/payments.js). That route currently checks the shared secret
 *     header `x-webhook-secret`.
 *
 *       // TODO(gateway): signature verification goes in src/routes/payments.js
 *       // (webhook handler). Most aggregators sign the RAW body with HMAC-SHA256;
 *       // verify it with crypto.timingSafeEqual before trusting `status`, and map
 *       // the gateway's own status names to: successful | failed | cancelled.
 */
export const gatewayDriver = {
  name: 'gateway',
  simulated: false,

  // eslint-disable-next-line no-unused-vars
  async initiate(order) {
    throw new HttpError(501, 'Gateway halisi bado haijaunganishwa. Tafadhali wasiliana na msimamizi wa duka.');
  },
};
