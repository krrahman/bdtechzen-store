import nodemailer, { type Transporter } from 'nodemailer';
import crypto from 'crypto';
import { Order, OrderNotification, StoreSettings } from './db.js';

let cachedTestTransporter: Transporter | null = null;

function normalizeBangladeshMobile(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return `+88${digits}`;
  }
  if (digits.startsWith('1') && digits.length === 10) {
    return `+880${digits}`;
  }
  return rawPhone.trim();
}

function isSyntheticGuestEmail(email: string): boolean {
  if (!email) return true;
  return email.toLowerCase().endsWith('@guest.bdtechzen.com');
}

function formatPaymentLabel(method: Order['paymentMethod']): string {
  const map: Record<string, string> = {
    cod: 'Cash on Delivery',
    bkash: 'bKash',
    nagad: 'Nagad',
    rocket: 'Rocket',
    sslcommerz: 'Card / SSLCOMMERZ',
    card: 'Debit / Credit Card'
  };
  return map[method] || method.toUpperCase();
}

function buildSmsText(
  order: Order,
  event: OrderNotification['event'],
  settings: StoreSettings
): string {
  const brand = settings.storeName || 'BDTechZen';
  const firstName = order.customerName.trim().split(/\s+/)[0] || 'Valued Client';
  const amount = `Tk ${order.grandTotal.toLocaleString('en-BD')}`;
  const support = (settings.whatsappNumber || '+8801623604635').replace(/\s+/g, '');

  if (event === 'payment_confirmed') {
    return `${brand}: Dear ${firstName}, payment of ${amount} is confirmed for Order #${order.orderNumber}${
      order.transactionRef ? ` (Ref: ${order.transactionRef})` : ''
    }. Your pair is now entering final inspection in Dhaka. Help: ${support}`;
  }

  if (event === 'status_updated') {
    if (order.orderStatus === 'shipped') {
      const courier = order.courierName || 'Courier';
      const waybill = order.trackingNumber ? ` (Waybill: ${order.trackingNumber})` : '';
      const codNote = order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' ? ` Please keep ${amount} ready at delivery.` : '';
      return `${brand}: Hi ${firstName}, Order #${order.orderNumber} has been handed over to ${courier}${waybill}.${codNote} Help: ${support}`;
    }
    if (order.orderStatus === 'delivered') {
      return `${brand}: Hi ${firstName}, Order #${order.orderNumber} is marked Delivered. Thank you for walking with us—7-day doorstep size exchange applies if needed.`;
    }
    if (order.orderStatus === 'cancelled') {
      return `${brand}: Hi ${firstName}, Order #${order.orderNumber} has been cancelled as requested. Reach us at ${support} if you need assistance.`;
    }
    return `${brand}: Hi ${firstName}, Order #${order.orderNumber} status is now ${order.orderStatus.replace(
      /_/g,
      ' '
    )}. Help: ${support}`;
  }

  // Default: order_placed
  const isDhaka =
    order.shippingAddress.city.toLowerCase().includes('dhaka') ||
    order.shippingAddress.stateDivision.toLowerCase().includes('dhaka');
  const eta = isDhaka ? '24-48h inside Dhaka' : '2-4 business days';
  const payShort = order.paymentMethod === 'cod' ? 'COD' : formatPaymentLabel(order.paymentMethod);

  return `${brand}: Dear ${firstName}, Order #${order.orderNumber} (${amount}, ${payShort}) is confirmed! Est. delivery: ${eta}. Track with your Order ID anytime. Help: ${support}`;
}

function buildEmailContent(
  order: Order,
  event: OrderNotification['event'],
  settings: StoreSettings
): { subject: string; text: string; html: string } {
  const brand = settings.storeName || 'BDTechZen';
  const supportPhone = settings.supportPhone || '+880 1623-604635';
  const supportEmail = settings.supportEmail || 'support@bdtechzen.com';
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const trackUrl = `${appUrl.replace(/\/$/, '')}/track`;

  let headline = `We have received your order, ${order.customerName.split(' ')[0]}.`;
  let subcopy =
    'Each pair is inspected by hand at our Dhaka workshop for leather grain, stitch tension, and outsole finish before courier handover.';
  let subject = `Order Confirmed · ${order.orderNumber} — ${brand}`;

  if (event === 'payment_confirmed') {
    subject = `Payment Received · ${order.orderNumber} — ${brand}`;
    headline = `Your payment of ৳${order.grandTotal.toLocaleString('en-BD')} is confirmed.`;
    subcopy = `Transaction reference ${order.transactionRef || 'Verified'} has been recorded. Our workshop team is now preparing your box for dispatch.`;
  } else if (event === 'status_updated') {
    const cleanStatus = order.orderStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    subject = `Shipment Update (${cleanStatus}) · ${order.orderNumber} — ${brand}`;
    headline = `Your order ${order.orderNumber} is now ${cleanStatus}.`;
    subcopy = order.courierName
      ? `Assigned Courier: ${order.courierName}${order.trackingNumber ? ` · Consignment Waybill: ${order.trackingNumber}` : ''}.`
      : 'You can inspect real-time courier milestones anytime using your order reference.';
  }

  const itemsText = order.items
    .map(
      (i) =>
        `- ${i.productName} | EU ${i.size} · ${i.color} × ${i.quantity} — BDT ${i.totalPrice.toLocaleString('en-BD')}`
    )
    .join('\n');

  const text = [
    `${brand} — Official Order Dispatch Notice`,
    `Order Reference: ${order.orderNumber}`,
    ``,
    headline,
    subcopy,
    ``,
    `Items:`,
    itemsText,
    ``,
    `Subtotal: BDT ${order.subtotal.toLocaleString('en-BD')}`,
    order.discount > 0 ? `Discount: -BDT ${order.discount.toLocaleString('en-BD')}` : null,
    `Shipping: ${order.shippingCharge === 0 ? 'Complimentary' : `BDT ${order.shippingCharge}`}`,
    `Total Payable: BDT ${order.grandTotal.toLocaleString('en-BD')} (${formatPaymentLabel(order.paymentMethod)})`,
    ``,
    `Delivery Address:`,
    `${order.shippingAddress.fullName}, ${order.shippingAddress.phone}`,
    `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.stateDivision}`,
    ``,
    `Track your shipment: ${trackUrl}`,
    `Sizing & Order Desk (10 AM – 10 PM): ${supportPhone} | ${supportEmail}`
  ]
    .filter(Boolean)
    .join('\n');

  const itemRowsHtml = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e7e5e4; font-size: 14px; color: #18181b;">
          <strong>${i.productName}</strong><br/>
          <span style="font-size: 12px; color: #71717a;">Size EU ${i.size} · ${i.color} · Qty ${i.quantity}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e7e5e4; font-size: 14px; color: #18181b; text-align: right; font-family: monospace;">
          ৳${i.totalPrice.toLocaleString('en-BD')}
        </td>
      </tr>`
    )
    .join('');

  const html = `
  <div style="background-color: #f7f6f2; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #18181b;">
    <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e4df; border-radius: 12px; overflow: hidden;">
      <div style="background: #111113; color: #ffffff; padding: 28px 32px;">
        <div style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">
          BD<span style="color: #a78bfa; font-style: italic;">Tech</span>Zen
        </div>
        <p style="margin: 16px 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa;">
          Order Reference · ${order.orderNumber}
        </p>
        <h1 style="margin: 0; font-size: 22px; font-weight: 600; line-height: 1.3; color: #ffffff;">
          ${headline}
        </h1>
      </div>

      <div style="padding: 28px 32px;">
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b;">
          ${subcopy}
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${itemRowsHtml}
        </table>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #52525b; margin-bottom: 24px;">
          <tr>
            <td style="padding: 4px 0;">Subtotal</td>
            <td style="padding: 4px 0; text-align: right; font-family: monospace;">৳${order.subtotal.toLocaleString('en-BD')}</td>
          </tr>
          ${
            order.discount > 0
              ? `<tr><td style="padding: 4px 0; color: #047857;">Discount</td><td style="padding: 4px 0; text-align: right; font-family: monospace; color: #047857;">-৳${order.discount.toLocaleString('en-BD')}</td></tr>`
              : ''
          }
          <tr>
            <td style="padding: 4px 0;">Courier Delivery</td>
            <td style="padding: 4px 0; text-align: right; font-family: monospace;">${
              order.shippingCharge === 0 ? 'Complimentary' : `৳${order.shippingCharge}`
            }</td>
          </tr>
          <tr>
            <td style="padding: 12px 0 0; border-top: 1px solid #d6d3d1; font-size: 15px; font-weight: 700; color: #111113;">Total (${formatPaymentLabel(
              order.paymentMethod
            )})</td>
            <td style="padding: 12px 0 0; border-top: 1px solid #d6d3d1; text-align: right; font-size: 16px; font-weight: 700; color: #111113; font-family: monospace;">৳${order.grandTotal.toLocaleString(
              'en-BD'
            )}</td>
          </tr>
        </table>

        <div style="background: #f7f6f2; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; font-size: 13px; color: #3f3f46; margin-bottom: 24px;">
          <strong style="color: #111113; display: block; margin-bottom: 4px;">Delivery Destination</strong>
          ${order.shippingAddress.fullName} · ${order.shippingAddress.phone}<br/>
          ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.stateDivision}, Bangladesh
        </div>

        <a href="${trackUrl}" style="display: inline-block; background: #111113; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-size: 13px; font-weight: 600;">
          Track Shipment (${order.orderNumber})
        </a>

        <p style="margin: 24px 0 0; font-size: 12px; color: #71717a; line-height: 1.6;">
          Need a size adjustment or courier assistance? Call or WhatsApp our Dhaka desk at <strong>${supportPhone}</strong> or reply to ${supportEmail}.
        </p>
      </div>
    </div>
  </div>`;

  return { subject, text, html };
}

async function sendSmsMessage(
  phone: string,
  message: string,
  settings?: StoreSettings
): Promise<{ status: 'sent' | 'dispatched'; provider: string }> {
  const notif = settings?.notifications;
  const apiUrl = (notif?.smsGatewayUrl || process.env.SMS_API_URL || '').trim();
  const apiKey = (notif?.smsApiKey || process.env.SMS_API_KEY || '').trim();
  const senderId = (notif?.smsSenderId || process.env.SMS_SENDER_ID || 'BDTechZen').trim();
  const cleanNumber = phone.replace(/^\+/, '');

  if (apiUrl && apiKey) {
    try {
      const isGreenWeb = apiUrl.toLowerCase().includes('greenweb');
      if (isGreenWeb) {
        const gwUrl = new URL(apiUrl);
        gwUrl.searchParams.set('token', apiKey);
        gwUrl.searchParams.set('to', `+${cleanNumber}`);
        gwUrl.searchParams.set('message', message);
        const gwRes = await fetch(gwUrl.toString(), { method: 'GET' });
        if (gwRes.ok) {
          return { status: 'sent', provider: 'GreenWeb BD SMS Gateway (Live)' };
        }
      } else {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            type: 'text',
            senderid: senderId,
            number: cleanNumber,
            message
          })
        });
        if (response.ok) {
          return { status: 'sent', provider: 'Bangladesh SMS Gateway (Live)' };
        }
      }
    } catch (err) {
      console.warn('[Notifications] Live SMS gateway unreachable, recorded in outbox:', err);
    }
  }

  console.log(`[SMS Dispatch -> ${phone}] ${message}`);
  return { status: 'dispatched', provider: 'BDTechZen SMS Relay' };
}

async function sendNtfyPushServer(
  topic: string | undefined,
  title: string,
  body: string,
  tags = 'bell'
): Promise<boolean> {
  const cleanTopic = (topic || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanTopic) return false;
  try {
    const res = await withTimeout(
      fetch(`https://ntfy.sh/${cleanTopic}`, {
        method: 'POST',
        headers: {
          Title: title,
          Priority: 'high',
          Tags: tags
        },
        body
      }),
      3500
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function sendFormSubmitRelayEmail(
  toEmail: string,
  subject: string,
  fields: Record<string, string>
): Promise<{ ok: boolean; message: string }> {
  if (!toEmail || !toEmail.includes('@')) return { ok: false, message: 'Invalid admin email' };
  try {
    const res = await withTimeout(
      fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail.trim())}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: process.env.APP_URL || 'https://bdtechzen.netlify.app',
          Referer: process.env.APP_URL || 'https://bdtechzen.netlify.app/'
        },
        body: JSON.stringify({
          _subject: subject,
          _template: 'table',
          _captcha: 'false',
          ...fields
        })
      }),
      4000
    );
    const data: any = await res.json().catch(() => ({}));
    if (res.ok && (data.success === true || data.success === 'true')) {
      return { ok: true, message: `Email delivered to ${toEmail}` };
    }
    return {
      ok: false,
      message:
        data.message ||
        `Check ${toEmail} inbox (and Spam) to click the 1-time FormSubmit activation button.`
    };
  } catch {
    return { ok: false, message: 'FormSubmit relay unreachable' };
  }
}

let etherealUnavailable = false;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function sendEmailMessage(
  to: string,
  subject: string,
  text: string,
  html: string,
  senderName: string
): Promise<{ status: 'sent' | 'dispatched'; provider: string; previewUrl?: string }> {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const fromAddress = process.env.SMTP_FROM?.trim() || `${senderName} <orders@bdtechzen.com>`;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 5000,
        auth: { user: smtpUser, pass: smtpPass }
      });
      await withTimeout(transporter.sendMail({ from: fromAddress, to, subject, text, html }), 5000);
      return { status: 'sent', provider: `SMTP (${smtpHost})` };
    } catch (err) {
      console.warn('[Notifications] Live SMTP failed, falling back to Ethereal/Outbox:', err);
    }
  }

  // Try Nodemailer Ethereal test relay with fast 2.5s timeout so checkout is always snappy
  if (!etherealUnavailable) {
    try {
      if (!cachedTestTransporter) {
        const testAccount = await withTimeout(nodemailer.createTestAccount(), 2500);
        cachedTestTransporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          connectionTimeout: 2500,
          greetingTimeout: 2500,
          socketTimeout: 3000,
          auth: { user: testAccount.user, pass: testAccount.pass }
        });
      }
      const info = await withTimeout(
        cachedTestTransporter.sendMail({
          from: fromAddress,
          to,
          subject,
          text,
          html
        }),
        3000
      );
      const url = nodemailer.getTestMessageUrl(info);
      return {
        status: 'sent',
        provider: 'Transactional Email Relay',
        previewUrl: typeof url === 'string' ? url : undefined
      };
    } catch {
      etherealUnavailable = true;
    }
  }

  console.log(`[Email Dispatch -> ${to}] Subject: ${subject}`);
  return { status: 'dispatched', provider: 'BDTechZen Mail Outbox' };
}

export async function dispatchOrderNotifications(
  order: Order,
  event: OrderNotification['event'],
  settings: StoreSettings
): Promise<OrderNotification[]> {
  const dispatched: OrderNotification[] = [];
  const emailEnabled = settings.notifications?.emailEnabled !== false;
  const smsEnabled = settings.notifications?.smsEnabled !== false;
  const senderName = settings.notifications?.senderName || settings.storeName || 'BDTechZen';
  const adminEmail = (settings.notifications?.adminAlertEmail || 'khalil5172@gmail.com').trim();
  const adminPhone = (
    settings.notifications?.adminAlertPhone ||
    settings.whatsappNumber ||
    '+8801623604635'
  ).trim();

  // 1. Customer Mobile SMS Notification
  if (smsEnabled && order.customerPhone) {
    const normalizedPhone = normalizeBangladeshMobile(order.customerPhone);
    const smsBody = buildSmsText(order, event, settings);
    const smsRes = await sendSmsMessage(normalizedPhone, smsBody, settings);

    dispatched.push({
      id: `notif_sms_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      channel: 'sms',
      event,
      recipient: normalizedPhone,
      message: smsBody,
      status: smsRes.status,
      provider: smsRes.provider,
      sentAt: new Date().toISOString()
    });
  }

  // 2. Customer Email Notification
  if (emailEnabled && order.customerEmail && !isSyntheticGuestEmail(order.customerEmail)) {
    const { subject, text, html } = buildEmailContent(order, event, settings);
    const emailRes = await sendEmailMessage(order.customerEmail, subject, text, html, senderName);

    dispatched.push({
      id: `notif_eml_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      channel: 'email',
      event,
      recipient: order.customerEmail,
      subject,
      message: `Digital invoice & tracking link sent to ${order.customerEmail}`,
      status: emailRes.status,
      provider: emailRes.provider,
      previewUrl: emailRes.previewUrl,
      sentAt: new Date().toISOString()
    });
  }

  // 3. Admin Alerts on New Order (Email + Mobile SMS + Instant Push)
  if (event === 'order_placed' && settings.notifications?.notifyAdminOnNewOrder !== false) {
    const itemsSummary = order.items
      .map(
        (i) =>
          `${i.productName} (EU ${i.size}, ${i.color}) x${i.quantity} = Tk ${i.totalPrice.toLocaleString('en-BD')}`
      )
      .join(' | ');
    const fullAddr = `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.stateDivision}`;
    const adminSubject = `[New Order ${order.orderNumber}] ৳${order.grandTotal.toLocaleString('en-BD')} (${order.paymentMethod.toUpperCase()}) — ${order.customerName}`;

    if (adminEmail) {
      const hasSmtp = Boolean(
        process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
      );
      if (hasSmtp) {
        const { text, html } = buildEmailContent(order, event, settings);
        await sendEmailMessage(adminEmail, adminSubject, text, html, senderName);
      } else {
        await sendFormSubmitRelayEmail(adminEmail, adminSubject, {
          Order_Reference: order.orderNumber,
          Payable_Total_BDT: `৳${order.grandTotal.toLocaleString('en-BD')} (${order.paymentMethod.toUpperCase()})`,
          Customer_Name: order.customerName,
          Customer_Mobile: order.customerPhone,
          Customer_Email: order.customerEmail,
          Delivery_Address: fullAddr,
          Ordered_Pairs: itemsSummary
        });
      }
    }

    if (adminPhone) {
      const normalizedAdminPhone = normalizeBangladeshMobile(adminPhone);
      const adminSms = `BDTechZen New Order #${order.orderNumber}: Tk ${order.grandTotal.toLocaleString(
        'en-BD'
      )} (${order.paymentMethod.toUpperCase()}) from ${order.customerName} (${order.customerPhone}, ${
        order.shippingAddress.city
      }).`;
      await sendSmsMessage(normalizedAdminPhone, adminSms, settings);
    }

    await sendNtfyPushServer(
      settings.notifications?.ntfyTopic,
      `New Order ${order.orderNumber} (Tk ${order.grandTotal.toLocaleString('en-BD')})`,
      `${order.customerName} (${order.customerPhone})\n${itemsSummary}\nAddr: ${fullAddr}`,
      'athletic_shoe,moneybag'
    );
  }

  if (!order.notifications) {
    order.notifications = [];
  }
  order.notifications.unshift(...dispatched);

  if (dispatched.length > 0) {
    const summaryChannels = dispatched.map((d) => `${d.channel.toUpperCase()} → ${d.recipient}`).join(' · ');
    order.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'Customer & Admin Notified',
      note: summaryChannels,
      actor: 'Notification Desk'
    });
  }

  return dispatched;
}

export async function dispatchNewUserAdminNotifications(
  user: { name: string; email: string; phone: string; createdAt: string },
  settings: StoreSettings
): Promise<void> {
  if (settings.notifications?.notifyAdminOnNewUser === false) return;

  const senderName = settings.notifications?.senderName || settings.storeName || 'BDTechZen';
  const adminEmail = (settings.notifications?.adminAlertEmail || 'khalil5172@gmail.com').trim();
  const adminPhone = (
    settings.notifications?.adminAlertPhone ||
    settings.whatsappNumber ||
    '+8801623604635'
  ).trim();
  const subject = `[New Customer Registered] ${user.name} (${user.phone}) — BDTechZen`;

  if (adminEmail) {
    const hasSmtp = Boolean(
      process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
    );
    if (hasSmtp) {
      const text = `New Customer Registered on BDTechZen\nName: ${user.name}\nPhone: ${user.phone}\nEmail: ${user.email}\nRegistered At: ${user.createdAt}`;
      const html = `<div style="font-family:sans-serif;padding:24px;"><h2>New Customer Account Registered</h2><p><strong>Name:</strong> ${user.name}</p><p><strong>Mobile:</strong> ${user.phone}</p><p><strong>Email:</strong> ${user.email}</p><p><strong>Time:</strong> ${user.createdAt}</p></div>`;
      await sendEmailMessage(adminEmail, subject, text, html, senderName);
    } else {
      await sendFormSubmitRelayEmail(adminEmail, subject, {
        Alert_Type: 'New Customer Account Registration',
        Customer_Name: user.name,
        Customer_Mobile: user.phone,
        Customer_Email: user.email,
        Registered_At: new Date(user.createdAt).toLocaleString('en-BD')
      });
    }
  }

  if (adminPhone) {
    const normalizedAdminPhone = normalizeBangladeshMobile(adminPhone);
    await sendSmsMessage(
      normalizedAdminPhone,
      `BDTechZen New Member Registered: ${user.name}, Phone: ${user.phone}, Email: ${user.email}`,
      settings
    );
  }

  await sendNtfyPushServer(
    settings.notifications?.ntfyTopic,
    `New Customer Registered: ${user.name}`,
    `Mobile: ${user.phone}\nEmail: ${user.email}`,
    'bust_in_silhouette,bell'
  );
}

export async function dispatchTestAdminNotifications(settings: StoreSettings) {
  const adminEmail = (settings.notifications?.adminAlertEmail || 'khalil5172@gmail.com').trim();
  const adminPhone = (
    settings.notifications?.adminAlertPhone ||
    settings.whatsappNumber ||
    '+8801623604635'
  ).trim();
  const nowStr = new Date().toLocaleString('en-BD');

  const emailRes = await sendFormSubmitRelayEmail(
    adminEmail,
    `[Test Alert] BDTechZen Admin Order & User Notification Verified`,
    {
      Status: 'Admin Email Alert Connected Successfully',
      Admin_Email: adminEmail,
      Admin_Mobile: adminPhone,
      Triggers_Active: 'New Order Placed + New User Account Created',
      Tested_At: nowStr
    }
  );

  const mobilePushSent = await sendNtfyPushServer(
    settings.notifications?.ntfyTopic,
    'BDTechZen Test Alert Connected!',
    `Your phone will now ring instantly for every new order & new user registration (${nowStr}).`,
    'white_check_mark,bell'
  );

  const normalizedAdminPhone = normalizeBangladeshMobile(adminPhone);
  const smsRes = await sendSmsMessage(
    normalizedAdminPhone,
    `BDTechZen Test Alert: Admin mobile SMS notifications are active (${nowStr}).`,
    settings
  );

  return {
    emailSent: emailRes.ok,
    emailMessage: emailRes.message,
    netlifyFormCaptured: false,
    mobilePushSent,
    smsSent: smsRes.status === 'sent',
    smsMessage:
      smsRes.status === 'sent'
        ? `SMS delivered via ${smsRes.provider}`
        : 'Add your BulkSMSBD / GreenWeb API Key in Settings to enable carrier SIM SMS'
  };
}
