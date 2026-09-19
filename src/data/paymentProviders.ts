// The product catalogue lives in the database (seeded from server/src/seed/products.js).
import { PaymentProviderInfo } from '../types';

export const PAYMENT_PROVIDERS: PaymentProviderInfo[] = [
  {
    id: 'tigopesa',
    name: 'Tigo Pesa (Mix)',
    ussdName: '*150*01#',
    color: '#003366',
    badgeBg: '#002244',
    prefix: ['065', '067', '071', '077'],
    logoText: 'Tigo Pesa',
    instructions: 'Utapokea ujumbe rasmi wa Tigo Pesa kwenye simu yako kuthibitisha malipo kwa kuingiza PIN yako ya siri.'
  },
  {
    id: 'mpesa',
    name: 'M-Pesa (Vodacom)',
    ussdName: '*150*00#',
    color: '#E60000',
    badgeBg: '#8B0000',
    prefix: ['074', '075', '076'],
    logoText: 'M-Pesa',
    instructions: 'Utapokea taarifa ya papo hapo (USSD push) kutoka Vodacom M-Pesa kwenye kioo cha simu yako kuingiza PIN yako.'
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    ussdName: '*150*60#',
    color: '#FF0000',
    badgeBg: '#990000',
    prefix: ['068', '069', '078'],
    logoText: 'Airtel Money',
    instructions: 'Airtel Money itatuma ombi la malipo kwenye simu yako. Hakikisha simu yako ipo hewani.'
  },
  {
    id: 'halopesa',
    name: 'HaloPesa',
    ussdName: '*150*88#',
    color: '#FF6F00',
    badgeBg: '#B34700',
    prefix: ['062', '061'],
    logoText: 'HaloPesa',
    instructions: 'Ujumbe rasmi wa HaloPesa utajitokeza mara moja kuidhinisha malipo.'
  }
];
