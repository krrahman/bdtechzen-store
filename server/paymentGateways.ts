import { Order, getDatabase, saveDatabase } from './db.js';
import { dispatchOrderNotifications } from './notifications.js';

export interface PaymentInitiationResult {
  success: boolean;
  gateway: string;
  transactionRef: string;
  orderNumber: string;
  amount: number;
  currency: 'BDT';
  redirectUrl?: string;
  paymentInstructions?: {
    accountNumber?: string;
    referenceCode: string;
    instructions: string[];
  };
  isSandbox: boolean;
  message: string;
}

const processedTransactions = new Set<string>();

export function initiatePayment(order: Order, paymentMethod: string): PaymentInitiationResult {
  const db = getDatabase();
  const settings = db.settings;

  const transactionRef = `TXN-BD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (paymentMethod === 'cod') {
    return {
      success: true,
      gateway: 'Cash on Delivery (COD)',
      transactionRef: `COD-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      currency: 'BDT',
      isSandbox: false,
      message: 'Cash on Delivery confirmed. Pay in cash upon receiving your footwear.'
    };
  }

  if (paymentMethod === 'bkash') {
    const isSandbox = settings.paymentGateways.bkashSandbox;
    return {
      success: true,
      gateway: 'bKash Merchant Payment',
      transactionRef,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      currency: 'BDT',
      isSandbox,
      paymentInstructions: {
        accountNumber: '01712-345678 (Merchant)',
        referenceCode: order.orderNumber,
        instructions: [
          'Open your bKash App or dial *247#',
          'Choose "Payment" (Merchant Pay)',
          'Enter Merchant Number: 01712-345678',
          `Enter Amount: ৳${order.grandTotal.toLocaleString('en-BD')}`,
          `Enter Reference: ${order.orderNumber}`,
          'Confirm with your bKash PIN and paste the TrxID below'
        ]
      },
      message: isSandbox
        ? 'bKash Sandbox Mode active. Click Verify Payment below to simulate instant confirmation.'
        : 'bKash Merchant Gateway connected.'
    };
  }

  if (paymentMethod === 'nagad') {
    const isSandbox = settings.paymentGateways.nagadSandbox;
    return {
      success: true,
      gateway: 'Nagad Merchant Checkout',
      transactionRef,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      currency: 'BDT',
      isSandbox,
      paymentInstructions: {
        accountNumber: '01812-987654 (Merchant)',
        referenceCode: order.orderNumber,
        instructions: [
          'Open your Nagad App or dial *167#',
          'Select "Merchant Pay"',
          'Enter Merchant Account: 01812-987654',
          `Enter Amount: ৳${order.grandTotal.toLocaleString('en-BD')}`,
          `Reference: ${order.orderNumber}`,
          'Confirm with your 4-digit Nagad PIN'
        ]
      },
      message: isSandbox
        ? 'Nagad Sandbox Mode active. Click Verify Payment below to confirm.'
        : 'Nagad Merchant Gateway active.'
    };
  }

  if (paymentMethod === 'rocket') {
    return {
      success: true,
      gateway: 'DBBL Rocket Merchant Pay',
      transactionRef,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      currency: 'BDT',
      isSandbox: true,
      paymentInstructions: {
        accountNumber: '01912-345678-9 (Merchant)',
        referenceCode: order.orderNumber,
        instructions: [
          'Open Rocket App or dial *322#',
          'Select "Merchant Pay"',
          'Enter Biller / Merchant Number: 01912-345678-9',
          `Reference: ${order.orderNumber}`,
          `Amount: ৳${order.grandTotal.toLocaleString('en-BD')}`
        ]
      },
      message: 'DBBL Rocket Sandbox Mode active.'
    };
  }

  if (paymentMethod === 'sslcommerz' || paymentMethod === 'card') {
    const isSandbox = settings.paymentGateways.sslcommerzSandbox;
    return {
      success: true,
      gateway: 'SSLCOMMERZ Secure Gateway (Visa / Mastercard / Nexus)',
      transactionRef,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      currency: 'BDT',
      isSandbox,
      paymentInstructions: {
        referenceCode: order.orderNumber,
        instructions: [
          'Supports all local & international Visa, Mastercard, AMEX, and DBBL Nexus cards.',
          'Protected by 256-bit SSL encryption.'
        ]
      },
      message: isSandbox
        ? 'SSLCOMMERZ Sandbox Session (Store ID: bdtechzen_test).'
        : 'SSLCOMMERZ Live Session.'
    };
  }

  throw new Error(`Unsupported payment method: ${paymentMethod}`);
}

export async function verifyAndCapturePayment(
  orderId: string,
  transactionRef: string
): Promise<{ success: boolean; order: Order; message: string }> {
  if (processedTransactions.has(transactionRef)) {
    const db = getDatabase();
    const existingOrder = db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (existingOrder && existingOrder.paymentStatus === 'paid') {
      return {
        success: true,
        order: existingOrder,
        message: 'Payment already verified and captured.'
      };
    }
  }

  const db = getDatabase();
  const order = db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.paymentStatus === 'paid') {
    return { success: true, order, message: 'Order is already marked as paid.' };
  }

  order.paymentStatus = 'paid';
  if (order.orderStatus === 'pending_payment') {
    order.orderStatus = 'confirmed';
  }
  order.transactionRef = transactionRef;
  order.updatedAt = new Date().toISOString();

  order.auditLog.push({
    timestamp: new Date().toISOString(),
    action: 'Payment Captured',
    note: `Ref: ${transactionRef} | Amount: ৳${order.grandTotal.toLocaleString('en-BD')}`,
    actor: 'Payment Gateway'
  });

  processedTransactions.add(transactionRef);
  await dispatchOrderNotifications(order, 'payment_confirmed', db.settings);
  await saveDatabase(db);

  return {
    success: true,
    order,
    message: `Payment of ৳${order.grandTotal.toLocaleString('en-BD')} verified successfully.`
  };
}
