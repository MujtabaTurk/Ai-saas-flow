const PRODUCT_NAME = "ServiceFlow";
const SUPPORT_LINE = "You received this transactional email from ServiceFlow.";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraph(value) {
  return `<p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.65">${escapeHtml(value)}</p>`;
}

function detailRow(label, value) {
  if (!value) {
    return "";
  }

  return `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:15px;font-weight:700;text-align:right">${escapeHtml(value)}</td>
    </tr>
  `;
}

function detailTable(rows) {
  const renderedRows = rows.map(([label, value]) => detailRow(label, value)).join("");

  if (!renderedRows) {
    return "";
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 22px;border-collapse:collapse;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">
      ${renderedRows}
    </table>
  `;
}

function renderCta({ actionUrl, actionLabel }) {
  if (!actionUrl) {
    return "";
  }

  const safeUrl = escapeHtml(actionUrl);
  const safeLabel = escapeHtml(actionLabel || "Open ServiceFlow");

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 18px">
      <tr>
        <td style="border-radius:10px;background:#0f766e">
          <a href="${safeUrl}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;border-radius:10px">${safeLabel}</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 18px;color:#64748b;font-size:13px;line-height:1.6">If the button does not work, copy and paste this link into your browser:<br /><a href="${safeUrl}" style="color:#0f766e;word-break:break-all">${safeUrl}</a></p>
  `;
}

function renderLayout({
  subject,
  preheader,
  eyebrow,
  title,
  intro,
  body = "",
  actionUrl = null,
  actionLabel = "Open ServiceFlow",
  footerNote = null
}) {
  const safeSubject = escapeHtml(subject);
  const safePreheader = escapeHtml(preheader || subject);
  const content = [
    paragraph(intro),
    body,
    renderCta({ actionUrl, actionLabel })
  ].join("");

  return {
    subject,
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${safeSubject}</title>
    <style>
      @media only screen and (max-width: 620px) {
        .sf-container { width: 100% !important; }
        .sf-card { border-radius: 0 !important; padding: 28px 20px !important; }
        .sf-title { font-size: 26px !important; }
      }
      @media (prefers-color-scheme: dark) {
        body, .sf-shell { background: #020617 !important; }
        .sf-card { background: #0f172a !important; border-color: #1e293b !important; }
        .sf-title, .sf-brand, td { color: #f8fafc !important; }
        p, .sf-footer { color: #cbd5e1 !important; }
        a { color: #5eead4 !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${safePreheader}</div>
    <table role="presentation" class="sf-shell" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 12px">
      <tr>
        <td align="center">
          <table role="presentation" class="sf-container" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px">
            <tr>
              <td style="padding:0 0 18px">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle">
                      <div style="display:inline-block;width:38px;height:38px;border-radius:12px;background:#0f766e;color:#ffffff;font-size:18px;font-weight:900;line-height:38px;text-align:center">SF</div>
                      <span class="sf-brand" style="margin-left:10px;color:#0f172a;font-size:18px;font-weight:900;vertical-align:middle">${PRODUCT_NAME}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="sf-card" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:36px;box-shadow:0 18px 45px rgba(15,23,42,.08)">
                <p style="margin:0 0 10px;color:#0f766e;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(eyebrow || PRODUCT_NAME)}</p>
                <h1 class="sf-title" style="margin:0 0 18px;color:#0f172a;font-size:30px;line-height:1.2;font-weight:900">${escapeHtml(title || subject)}</h1>
                ${content}
              </td>
            </tr>
            <tr>
              <td class="sf-footer" style="padding:18px 8px 0;color:#64748b;font-size:12px;line-height:1.6;text-align:center">
                ${escapeHtml(footerNote || SUPPORT_LINE)}<br />
                &copy; ${new Date().getUTCFullYear()} ${PRODUCT_NAME}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
  };
}

function renderGenericTemplate(data) {
  const subject = data.subject || "ServiceFlow notification";
  const intro = data.message || "There is a new ServiceFlow notification.";

  return renderLayout({
    subject,
    preheader: intro,
    title: subject,
    intro,
    actionUrl: data.actionUrl,
    actionLabel: data.actionLabel
  });
}

const templateRenderers = {
  "password-reset": (data) =>
    renderLayout({
      subject: data.subject || "Reset your ServiceFlow password",
      preheader: "Reset your ServiceFlow password securely.",
      eyebrow: "Account security",
      title: "Reset your password",
      intro:
        "Use this secure link to reset your password. The link expires in one hour.",
      body: paragraph("If you did not request a password reset, you can ignore this email. Your current password will stay unchanged."),
      actionUrl: data.resetUrl || data.actionUrl,
      actionLabel: "Reset password"
    }),
  "email-verification": (data) =>
    renderLayout({
      subject: data.subject || "Verify your ServiceFlow email",
      preheader: "Confirm your ServiceFlow email address.",
      eyebrow: "Email verification",
      title: "Verify your email",
      intro:
        "Confirm your email address to secure your ServiceFlow account and connect customer booking history that belongs to this email.",
      body: paragraph("If you did not create a ServiceFlow account, you can ignore this email."),
      actionUrl: data.verificationUrl || data.actionUrl,
      actionLabel: "Verify email"
    }),
  "team-invitation": (data) =>
    renderLayout({
      subject: data.subject || `Join ${data.businessName || PRODUCT_NAME} on ServiceFlow`,
      preheader: "A ServiceFlow team invitation is waiting for you.",
      eyebrow: "Team invitation",
      title: "You are invited",
      intro: `You have been invited to join ${data.businessName || "a business"} as ${String(data.role || "team member").toLowerCase()}.`,
      body: detailTable([
        ["Business", data.businessName],
        ["Role", data.role],
        ["Expires", data.expiresIn || "7 days"]
      ]),
      actionUrl: data.actionUrl,
      actionLabel: "Accept invitation"
    }),
  welcome: (data) => {
    const firstName = data.userName ? String(data.userName).split(" ")[0] : "there";

    return renderLayout({
      subject: data.subject || "Welcome to ServiceFlow",
      preheader: "Your ServiceFlow account is ready.",
      eyebrow: "Welcome",
      title: "Welcome to ServiceFlow",
      intro: `Hi ${firstName}, your ServiceFlow workspace is ready.`,
      body: paragraph("You can now set up services, availability, bookings, team members, billing, and customer notifications from one place."),
      actionUrl: data.actionUrl,
      actionLabel: "Open dashboard"
    });
  },
  "booking-confirmation": (data) =>
    renderLayout({
      subject: data.subject || "Your booking is confirmed",
      preheader: "Your booking details are inside.",
      eyebrow: "Booking",
      title: data.statusLabel || "Booking confirmed",
      intro: `${data.customerName || "Your"} ${data.serviceName || "appointment"} is scheduled${data.appointment ? ` for ${data.appointment}` : ""}.`,
      body: detailTable([
        ["Service", data.serviceName],
        ["When", data.appointment],
        ["Reference", data.bookingNumber],
        ["Business", data.businessName]
      ]),
      actionUrl: data.actionUrl,
      actionLabel: "Manage booking"
    }),
  "booking-cancellation": (data) =>
    renderLayout({
      subject: data.subject || "Booking canceled",
      preheader: "A booking has been canceled.",
      eyebrow: "Booking update",
      title: "Booking canceled",
      intro: `${data.serviceName || "The booking"}${data.appointment ? ` scheduled for ${data.appointment}` : ""} has been canceled.`,
      body: detailTable([
        ["Service", data.serviceName],
        ["When", data.appointment],
        ["Reference", data.bookingNumber],
        ["Customer", data.customerName]
      ]),
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "View booking"
    }),
  "booking-reminder": (data) =>
    renderLayout({
      subject: data.subject || "Upcoming booking reminder",
      preheader: "Your appointment is coming up.",
      eyebrow: "Reminder",
      title: "Your appointment is coming up",
      intro: `This is a reminder for ${data.serviceName || "your appointment"}${data.appointment ? ` on ${data.appointment}` : ""}.`,
      body: detailTable([
        ["Service", data.serviceName],
        ["When", data.appointment],
        ["Reference", data.bookingNumber],
        ["Business", data.businessName]
      ]),
      actionUrl: data.actionUrl,
      actionLabel: "View booking"
    }),
  "subscription-upgrade": (data) =>
    renderLayout({
      subject: data.subject || "Subscription updated",
      preheader: "Your subscription has been updated.",
      eyebrow: "Billing",
      title: "Subscription updated",
      intro: `Your ${data.planName || "ServiceFlow"} plan is now active.`,
      body: paragraph("Your account has access to the features included with the current plan."),
      actionUrl: data.actionUrl,
      actionLabel: "Open billing"
    }),
  "subscription-downgrade": (data) =>
    renderLayout({
      subject: data.subject || "Subscription changed",
      preheader: "Your subscription status changed.",
      eyebrow: "Billing",
      title: "Subscription changed",
      intro: `Your ${data.planName || "ServiceFlow"} subscription status changed.`,
      body: paragraph(data.message || "Review your billing settings to keep your workspace aligned with your plan."),
      actionUrl: data.actionUrl,
      actionLabel: "Review billing"
    }),
  "payment-success": (data) =>
    renderLayout({
      subject: data.subject || "Payment received",
      preheader: "Your payment was successful.",
      eyebrow: "Payment",
      title: "Payment received",
      intro: data.message || `Your payment for ${data.planName || "ServiceFlow"} was received successfully.`,
      actionUrl: data.actionUrl,
      actionLabel: "View billing"
    }),
  "payment-failure": (data) =>
    renderLayout({
      subject: data.subject || "Payment failed",
      preheader: "Update your payment method to avoid interruption.",
      eyebrow: "Payment required",
      title: "Payment failed",
      intro: data.message || "We could not process your subscription payment.",
      body: paragraph("Please update your billing method so ServiceFlow can keep your workspace active."),
      actionUrl: data.actionUrl,
      actionLabel: "Update payment method"
    }),
  "review-submitted": (data) =>
    renderLayout({
      subject: data.subject || "New ServiceFlow review",
      preheader: "A new customer review was submitted.",
      eyebrow: "Review",
      title: "New review submitted",
      intro: data.message || "A new customer review is waiting for moderation.",
      body: detailTable([
        ["Rating", data.rating ? `${data.rating} stars` : null],
        ["Booking", data.bookingNumber]
      ]),
      actionUrl: data.actionUrl,
      actionLabel: "Moderate review"
    }),
  diagnostic: (data) =>
    renderLayout({
      subject: data.subject || "ServiceFlow email delivery diagnostic",
      preheader: "SMTP email delivery diagnostic.",
      eyebrow: "Diagnostics",
      title: "SMTP delivery confirmed",
      intro:
        data.message ||
        "Nodemailer accepted this diagnostic message. Receiving it confirms the configured SMTP sender can deliver to this address.",
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "Open ServiceFlow"
    }),
  "generic-notification": renderGenericTemplate
};

export const EMAIL_TEMPLATE_NAMES = Object.keys(templateRenderers);

export function renderEmailTemplate(templateName, data = {}) {
  const renderer =
    templateRenderers[templateName] || templateRenderers["generic-notification"];

  return renderer(data);
}

export function createTemplatePreview(templateName) {
  const sample = {
    subject: "ServiceFlow email preview",
    message: "This preview shows the shared responsive email layout.",
    userName: "Alex Morgan",
    customerName: "Alex Morgan",
    businessName: "Northstar Studio",
    serviceName: "Strategy session",
    appointment: "Thursday, June 18, 2026 at 9:00 AM",
    bookingNumber: "SF-1024",
    role: "ADMIN",
    rating: 5,
    planName: "Pro",
    actionUrl: "https://example.com/dashboard",
    actionLabel: "Open ServiceFlow",
    expiresIn: "7 days"
  };

  return renderEmailTemplate(templateName, sample);
}
