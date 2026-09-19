import { randomInt } from 'node:crypto';

/**
 * Simulator driver: no external call and no real money. The order stays in
 * `processing` until POST /api/payments/simulate/:id decides the outcome.
 */
export const simulatorDriver = {
  name: 'simulator',
  simulated: true,

  async initiate(order) {
    const digits = String(randomInt(0, 1000000)).padStart(6, '0');
    return { gatewayRef: `SIM-${String(order.provider).toUpperCase()}-${digits}` };
  },
};
