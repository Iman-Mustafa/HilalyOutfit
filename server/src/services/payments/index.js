import { env } from '../../config/env.js';
import { simulatorDriver } from './simulator.js';
import { gatewayDriver } from './gateway.js';

const drivers = { simulator: simulatorDriver, gateway: gatewayDriver };

/** Returns the active payment driver, chosen by PAYMENT_DRIVER. */
export function getPaymentDriver() {
  return drivers[env.PAYMENT_DRIVER] || simulatorDriver;
}

export const isSimulator = () => getPaymentDriver().name === 'simulator';
