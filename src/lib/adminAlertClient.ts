import type { Order, StoreSettings } from '../types';

export interface AdminAlertDispatchResult {
  emailSent: boolean;
  emailMessage: string;
  netlifyFormCaptured: boolean;
  mobilePushSent: boolean;
  smsSent: boolean;
  smsMessage: string;
}

function normalizeBdPhone(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length === 13) return digits;
  if (digits.startsWith('01') && digits.length === 11) return `88${digits}`;
  if (digits.startsWith('1') && digits.length === 10) return `880${digits}`;
  return digits;
}

async function submitNetlifyHiddenForm(
  formName: string,
  fields: Record<string, string>
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams({
      'form-name': formName,
      ...fields
    });
    const res = await window.fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendFormSubmitEmail(
  adminEmail: string,
  subject: string,
  payload: Record<string, string>
): Promise<{ ok: boolean; message: string }> {
  if (!adminEmail || !adminEmail.includes('@')) {
    return { ok: false, message: 'No admin email configured' };
  }
  try {
    const res = await window.fetch(`https://formsubmit.co/ajax/${encodeURIComponent(adminEmail.trim())}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        ...payload
      })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && (data.success === 'true' || data.success === true)) {
      return { ok: true, message: `Email dispatched to ${adminEmail}` };
    }
    return {
      ok: false,
      message:
        data.message ||
        `Check ${adminEmail} inbox (including Spam) to click the 1-time FormSubmit activation button.`
    };
  } catch {
    return { ok: false, message: 'Could not reach FormSubmit email relay' };
  }
}

async function sendNtfyMobilePush(
  topic: string | undefined,
  title: string,
  bodyText: string,
  tags = 'shopping_cart'
): Promise<boolean> {
  const cleanTopic = (topic || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanTopic) return false;
  try {
    const res = await window.fetch(`https://ntfy.sh/${cleanTopic}`, {
      method: 'POST',
      headers: {
        Title: title,
        Priority: 'high',
        Tags: tags
      },
      body: bodyText
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendBangladeshGatewaySms(
  settings: StoreSettings,
  targetPhone: string,
  smsText: string
): Promise<{ ok: boolean; message: string }> {
  const notif = settings.notifications;
  const gatewayUrl = (notif?.smsGatewayUrl || '').trim();
  const apiKey = (notif?.smsApiKey || '').trim();
  const senderId = (notif?.smsSenderId || 'BDTechZen').trim();
  const formattedNumber = normalizeBdPhone(targetPhone);

  if (!gatewayUrl || !apiKey || !formattedNumber) {
    return { ok: false, message: 'SMS Gateway API Key not configured' };
  }

  try {
    // Support GreenWeb token format as well as standard BulkSMSBD / Alpha SMS query/JSON format
    const isGreenWeb = gatewayUrl.toLowerCase().includes('greenweb');
    const urlObj = new URL(gatewayUrl);
    if (isGreenWeb) {
      urlObj.searchParams.set('token', apiKey);
      urlObj.searchParams.set('to', `+${formattedNumber}`);
      urlObj.searchParams.set('message', smsText);
    } else {
      urlObj.searchParams.set('api_key', apiKey);
      urlObj.searchParams.set('type', 'text');
      urlObj.searchParams.set('number', formattedNumber);
      urlObj.searchParams.set('senderid', senderId);
      urlObj.searchParams.set('message', smsText);
    }

    const res = await window.fetch(urlObj.toString(), { method: 'GET' });
    if (res.ok) {
      return { ok: true, message: `SMS sent to +${formattedNumber}` };
    }
    return { ok: false, message: `SMS Gateway returned HTTP ${res.status}` };
  } catch {
    return { ok: false, message: 'SMS Gateway blocked by CORS or network error' };
  }
}

export async function dispatchClientNewOrderAlerts(
  order: Order,
  settings: StoreSettings
): Promise<AdminAlertDispatchResult> {
  const notif = settings.notifications;
  const adminEmail = (notif?.adminAlertEmail || 'khalil5172@gmail.com').trim();
  const adminPhone = (notif?.adminAlertPhone || settings.whatsappNumber || '+8801623604635').trim();
  const shouldAlertAdmin = notif?.notifyAdminOnNewOrder !== false;

  const itemsSummary = order.items
    .map(
      (i) =>
        `${i.productName} (EU ${i.size}, ${i.color}) x${i.quantity} = Tk ${i.totalPrice.toLocaleString('en-BD')}`
    )
    .join(' | ');

  const fullAddress = `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.stateDivision}`;

  // 1. Capture centrally in Netlify Forms (works immediately on Netlify Drag & Drop)
  const netlifyFormCaptured = await submitNetlifyHiddenForm('bdtechzen-new-order', {
    orderNumber: order.orderNumber,
    grandTotalBDT: `Tk ${order.grandTotal.toLocaleString('en-BD')}`,
    paymentMethod: order.paymentMethod.toUpperCase(),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    shippingAddress: fullAddress,
    itemsSummary,
    createdAt: order.createdAt
  });

  if (!shouldAlertAdmin) {
    return {
      emailSent: false,
      emailMessage: 'Admin order alert disabled',
      netlifyFormCaptured,
      mobilePushSent: false,
      smsSent: false,
      smsMessage: 'Disabled'
    };
  }

  // 2. Direct Admin Email via FormSubmit AJAX
  const emailRes = await sendFormSubmitEmail(
    adminEmail,
    `[New Order ${order.orderNumber}] ৳${order.grandTotal.toLocaleString('en-BD')} (${order.paymentMethod.toUpperCase()}) — ${order.customerName}`,
    {
      Order_Reference: order.orderNumber,
      Payable_Total_BDT: `৳${order.grandTotal.toLocaleString('en-BD')} (${order.paymentMethod.toUpperCase()})`,
      Customer_Name: order.customerName,
      Customer_Mobile: order.customerPhone,
      Customer_Email: order.customerEmail,
      Delivery_Address: fullAddress,
      Ordered_Pairs: itemsSummary,
      Order_Time: new Date(order.createdAt).toLocaleString('en-BD')
    }
  );

  // 3. Instant Free Mobile Push Notification via ntfy.sh
  const mobilePushSent = await sendNtfyMobilePush(
    notif?.ntfyTopic,
    `New Order ${order.orderNumber} (Tk ${order.grandTotal.toLocaleString('en-BD')})`,
    `${order.customerName} (${order.customerPhone})\n${itemsSummary}\nAddr: ${fullAddress}\nPay: ${order.paymentMethod.toUpperCase()}`,
    'athletic_shoe,moneybag'
  );

  // 4. Optional Bangladesh SMS Gateway (Admin + Customer)
  const adminSmsBody = `BDTechZen New Order #${order.orderNumber}: Tk ${order.grandTotal.toLocaleString(
    'en-BD'
  )} (${order.paymentMethod.toUpperCase()}) by ${order.customerName} (${order.customerPhone}, ${
    order.shippingAddress.city
  }).`;
  const smsRes = await sendBangladeshGatewaySms(settings, adminPhone, adminSmsBody);

  if (notif?.smsEnabled !== false && order.customerPhone) {
    const custSms = `BDTechZen: Dear ${order.customerName.split(' ')[0]}, Order #${
      order.orderNumber
    } (Tk ${order.grandTotal.toLocaleString('en-BD')}) is confirmed! Help: ${adminPhone}`;
    await sendBangladeshGatewaySms(settings, order.customerPhone, custSms);
  }

  return {
    emailSent: emailRes.ok,
    emailMessage: emailRes.message,
    netlifyFormCaptured,
    mobilePushSent,
    smsSent: smsRes.ok,
    smsMessage: smsRes.message
  };
}

export async function dispatchClientNewUserAlerts(
  user: { name: string; email: string; phone: string; createdAt: string },
  settings: StoreSettings
): Promise<AdminAlertDispatchResult> {
  const notif = settings.notifications;
  const adminEmail = (notif?.adminAlertEmail || 'khalil5172@gmail.com').trim();
  const adminPhone = (notif?.adminAlertPhone || settings.whatsappNumber || '+8801623604635').trim();
  const shouldAlertAdmin = notif?.notifyAdminOnNewUser !== false;

  // 1. Capture centrally in Netlify Forms
  const netlifyFormCaptured = await submitNetlifyHiddenForm('bdtechzen-new-user', {
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    country: 'Bangladesh (BD)',
    createdAt: user.createdAt
  });

  if (!shouldAlertAdmin) {
    return {
      emailSent: false,
      emailMessage: 'Admin new-user alert disabled',
      netlifyFormCaptured,
      mobilePushSent: false,
      smsSent: false,
      smsMessage: 'Disabled'
    };
  }

  // 2. Direct Admin Email via FormSubmit AJAX
  const emailRes = await sendFormSubmitEmail(
    adminEmail,
    `[New Customer Registered] ${user.name} (${user.phone}) — BDTechZen`,
    {
      Alert_Type: 'New Customer Account Registration',
      Customer_Name: user.name,
      Customer_Mobile: user.phone,
      Customer_Email: user.email,
      Country: 'Bangladesh',
      Registered_At: new Date(user.createdAt).toLocaleString('en-BD')
    }
  );

  // 3. Instant Free Mobile Push Notification via ntfy.sh
  const mobilePushSent = await sendNtfyMobilePush(
    notif?.ntfyTopic,
    `New Customer Registered: ${user.name}`,
    `Mobile: ${user.phone}\nEmail: ${user.email}\nStore: BDTechZen`,
    'bust_in_silhouette,bell'
  );

  // 4. Optional Bangladesh SMS Gateway to Admin Mobile
  const adminSmsBody = `BDTechZen New Member: ${user.name}, Phone: ${user.phone}, Email: ${user.email}`;
  const smsRes = await sendBangladeshGatewaySms(settings, adminPhone, adminSmsBody);

  return {
    emailSent: emailRes.ok,
    emailMessage: emailRes.message,
    netlifyFormCaptured,
    mobilePushSent,
    smsSent: smsRes.ok,
    smsMessage: smsRes.message
  };
}

export async function dispatchClientContactInquiry(
  inquiry: { name: string; email: string; phone: string; subject: string; message: string; createdAt: string },
  settings: StoreSettings
): Promise<void> {
  const adminEmail = (settings.notifications?.adminAlertEmail || 'khalil5172@gmail.com').trim();
  await submitNetlifyHiddenForm('bdtechzen-contact-inquiry', inquiry);
  await sendFormSubmitEmail(adminEmail, `[Customer Inquiry] ${inquiry.subject} — ${inquiry.name}`, {
    Name: inquiry.name,
    Phone: inquiry.phone || 'N/A',
    Email: inquiry.email || 'N/A',
    Subject: inquiry.subject,
    Message: inquiry.message
  });
  await sendNtfyMobilePush(
    settings.notifications?.ntfyTopic,
    `New Inquiry: ${inquiry.name}`,
    `Phone: ${inquiry.phone}\n${inquiry.message}`,
    'speech_balloon'
  );
}

export async function sendTestAdminAlert(settings: StoreSettings): Promise<AdminAlertDispatchResult> {
  const notif = settings.notifications;
  const adminEmail = (notif?.adminAlertEmail || 'khalil5172@gmail.com').trim();
  const adminPhone = (notif?.adminAlertPhone || settings.whatsappNumber || '+8801623604635').trim();
  const nowStr = new Date().toLocaleString('en-BD');

  const emailRes = await sendFormSubmitEmail(
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

  const mobilePushSent = await sendNtfyMobilePush(
    notif?.ntfyTopic,
    'BDTechZen Test Alert Connected!',
    `Your phone will now ring instantly for every new order & new user registration (${nowStr}).`,
    'white_check_mark,bell'
  );

  const smsRes = await sendBangladeshGatewaySms(
    settings,
    adminPhone,
    `BDTechZen Test Alert: Admin mobile SMS notifications are active (${nowStr}).`
  );

  return {
    emailSent: emailRes.ok,
    emailMessage: emailRes.message,
    netlifyFormCaptured: false,
    mobilePushSent,
    smsSent: smsRes.ok,
    smsMessage: smsRes.message
  };
}
