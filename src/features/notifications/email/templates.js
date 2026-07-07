const PRODUCT_NAME = "ServiceFlow";
const PRODUCT_TAGLINE = "AI booking operations";
const SUPPORT_LINE =
  "Need help? Open ServiceFlow or contact the team that sent this email.";

const theme = {
  canvas: "#F8F9FF",
  panel: "#FFFFFF",
  panelSoft: "#EFF4FF",
  brandMist: "#E5EEFF",
  brandSoft: "#D5E0F8",
  border: "#C7C4D8",
  ink: "#0B1C30",
  muted: "#464555",
  subtle: "#586377",
  brand: "#3525CD",
  brandHover: "#2C1EA9",
  danger: "#DC2626",
  warning: "#B45309"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function joinHtml(parts) {
  return parts.filter(Boolean).join("");
}

function humanize(value, fallback = "") {
  const text = String(value || fallback || "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim()
    .toLowerCase();

  if (!text) {
    return "";
  }

  return text.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function paragraph(value, options = {}) {
  if (!value) {
    return "";
  }

  const color = options.color || theme.subtle;
  const size = options.size || 15;
  const margin = options.margin || "0 0 16px";
  const weight = options.weight || 500;

  return `<p class="${options.className || ""}" style="margin:${margin};color:${color};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:${size}px;font-weight:${weight};line-height:1.65">${escapeHtml(value)}</p>`;
}

function detailRow(label, value) {
  if (!value) {
    return "";
  }

  return `
    <tr>
      <td style="padding:13px 0;border-top:1px solid #E1E5F0;color:${theme.muted};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:12px;font-weight:800;line-height:1.35;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(label)}</td>
      <td style="padding:13px 0;border-top:1px solid #E1E5F0;color:${theme.ink};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:14px;font-weight:800;line-height:1.45;text-align:right">${escapeHtml(value)}</td>
    </tr>
  `;
}

function detailTable(rows, title = "Details") {
  const renderedRows = rows.map(([label, value]) => detailRow(label, value)).join("");

  if (!renderedRows) {
    return "";
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="sf-detail-card" style="margin:22px 0 0;border:1px solid ${theme.border};border-radius:12px;background:${theme.canvas};border-collapse:separate;border-spacing:0">
      <tr>
        <td style="padding:18px 20px 4px">
          <p style="margin:0;color:${theme.ink};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:14px;font-weight:900;line-height:1.35">${escapeHtml(title)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px 8px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
            ${renderedRows}
          </table>
        </td>
      </tr>
    </table>
  `;
}

function infoBox(title, text, tone = "primary") {
  if (!title && !text) {
    return "";
  }

  const tones = {
    primary: {
      background: theme.panelSoft,
      border: theme.border,
      title: theme.ink,
      accent: theme.brand
    },
    warning: {
      background: "#FFF7ED",
      border: "#FDBA74",
      title: theme.warning,
      accent: theme.warning
    },
    danger: {
      background: "#FEF2F2",
      border: "#FCA5A5",
      title: theme.danger,
      accent: theme.danger
    }
  };
  const selected = tones[tone] || tones.primary;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="sf-info-box" style="margin:22px 0 0;border:1px solid ${selected.border};border-radius:12px;background:${selected.background};border-collapse:separate;border-spacing:0">
      <tr>
        <td style="padding:16px 18px;border-left:4px solid ${selected.accent};border-radius:12px">
          ${
            title
              ? `<p style="margin:0 0 6px;color:${selected.title};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:13px;font-weight:900;line-height:1.4">${escapeHtml(title)}</p>`
              : ""
          }
          ${
            text
              ? `<p style="margin:0;color:${theme.subtle};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:13px;font-weight:600;line-height:1.65">${escapeHtml(text)}</p>`
              : ""
          }
        </td>
      </tr>
    </table>
  `;
}

function stepList(items) {
  const renderedItems = items
    .filter(Boolean)
    .map(
      (item, index) => `
        <tr>
          <td width="32" valign="top" style="padding:${index === 0 ? "0" : "12px"} 0 0">
            <span style="display:inline-block;width:24px;height:24px;border-radius:8px;background:${theme.brandMist};color:${theme.brand};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:12px;font-weight:900;line-height:24px;text-align:center">${index + 1}</span>
          </td>
          <td valign="top" style="padding:${index === 0 ? "1px" : "13px"} 0 0;color:${theme.subtle};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:13px;font-weight:600;line-height:1.6">${escapeHtml(item)}</td>
        </tr>
      `
    )
    .join("");

  if (!renderedItems) {
    return "";
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="sf-detail-card" style="margin:22px 0 0;border:1px solid ${theme.border};border-radius:12px;background:${theme.panel};border-collapse:separate;border-spacing:0">
      <tr>
        <td style="padding:18px 20px">
          <p style="margin:0 0 12px;color:${theme.ink};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:14px;font-weight:900;line-height:1.35">Next steps</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
            ${renderedItems}
          </table>
        </td>
      </tr>
    </table>
  `;
}

function groupCode(value) {
  const code = String(value || "123456").replace(/\s+/g, "").toUpperCase();

  if (code.length <= 4) {
    return code;
  }

  return code.match(/.{1,3}/g).join(" ");
}

function otpBlock(value) {
  const code = groupCode(value);

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;border-collapse:collapse">
      <tr>
        <td align="center" class="sf-otp" style="padding:24px 16px;border:1px solid ${theme.border};border-radius:14px;background:${theme.canvas}">
          <p style="margin:0 0 8px;color:${theme.muted};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:12px;font-weight:900;line-height:1.4;text-transform:uppercase;letter-spacing:.08em">Verification code</p>
          <p style="margin:0;color:${theme.ink};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:36px;font-weight:900;line-height:1.1;letter-spacing:.18em">${escapeHtml(code)}</p>
        </td>
      </tr>
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
    <table role="presentation" cellspacing="0" cellpadding="0" class="sf-button-table" style="margin:28px 0 0;border-collapse:separate;border-spacing:0">
      <tr>
        <td class="sf-button-cell" bgcolor="${theme.brand}" style="border-radius:12px;background:${theme.brand}">
          <a class="sf-button" href="${safeUrl}" style="display:inline-block;border:1px solid ${theme.brand};border-radius:12px;padding:15px 24px;color:#FFFFFF;font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:15px;font-weight:900;line-height:1.2;text-align:center;text-decoration:none">${safeLabel}</a>
        </td>
      </tr>
    </table>
    <p class="sf-fallback-link" style="margin:14px 0 0;color:${theme.subtle};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:12px;font-weight:600;line-height:1.6">If the button does not work, copy and paste this link into your browser:<br /><a href="${safeUrl}" style="color:${theme.brand};font-weight:800;text-decoration:underline;word-break:break-all">${safeUrl}</a></p>
  `;
}

function renderLogo() {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
      <tr>
        <td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;border-radius:12px;background:${theme.brand};color:#FFFFFF;font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:20px;font-weight:900;line-height:44px;text-align:center">S</td>
        <td style="padding-left:12px">
          <p class="sf-brand" style="margin:0;color:${theme.ink};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:20px;font-weight:900;line-height:1.1">${PRODUCT_NAME}</p>
          <p style="margin:4px 0 0;color:${theme.muted};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:11px;font-weight:800;line-height:1.2;text-transform:uppercase;letter-spacing:.06em">${PRODUCT_TAGLINE}</p>
        </td>
      </tr>
    </table>
  `;
}

function renderLayout({
  subject,
  preheader,
  eyebrow,
  title,
  intro,
  supportingContent = "",
  actionUrl = null,
  actionLabel = "Open ServiceFlow",
  footerNote = null
}) {
  const safeSubject = escapeHtml(subject);
  const safePreheader = escapeHtml(preheader || subject);
  const content = joinHtml([
    paragraph(intro, {
      className: "sf-intro",
      color: theme.subtle,
      size: 16,
      weight: 600,
      margin: "0"
    }),
    renderCta({ actionUrl, actionLabel }),
    supportingContent
  ]);

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
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: ${theme.canvas};
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
      }

      table {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }

      img {
        border: 0;
        display: block;
        outline: none;
        text-decoration: none;
      }

      @media only screen and (max-width: 620px) {
        .sf-shell { padding: 22px 10px !important; }
        .sf-container { width: 100% !important; max-width: 100% !important; }
        .sf-header { padding: 0 8px 16px !important; }
        .sf-card { border-radius: 16px !important; padding: 28px 20px !important; }
        .sf-title { font-size: 27px !important; line-height: 1.14 !important; }
        .sf-intro { font-size: 15px !important; }
        .sf-button-table { width: 100% !important; }
        .sf-button-cell { display: block !important; width: 100% !important; }
        .sf-button { display: block !important; padding-left: 16px !important; padding-right: 16px !important; }
        .sf-otp p:last-child { font-size: 31px !important; letter-spacing: .12em !important; }
        .sf-footer { padding-left: 12px !important; padding-right: 12px !important; }
      }

      @media (prefers-color-scheme: dark) {
        body, .sf-shell { background: #07111F !important; }
        .sf-card, .sf-detail-card { background: #101A2B !important; border-color: #26344D !important; }
        .sf-info-box, .sf-otp { background: #132139 !important; border-color: #31425F !important; }
        .sf-brand, .sf-title, .sf-detail-card p, .sf-otp p:last-child, td { color: #F8FAFC !important; }
        .sf-intro, .sf-footer, .sf-fallback-link, .sf-info-box p, .sf-detail-card td { color: #CBD5E1 !important; }
        .sf-button-cell { background: #6D63FF !important; }
        .sf-button { border-color: #6D63FF !important; color: #FFFFFF !important; }
        a { color: #B8C7FF !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${theme.canvas};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${safePreheader}</div>
    <table role="presentation" class="sf-shell" width="100%" cellspacing="0" cellpadding="0" style="background:${theme.canvas};padding:36px 12px">
      <tr>
        <td align="center">
          <table role="presentation" class="sf-container" width="620" cellspacing="0" cellpadding="0" style="width:620px;max-width:620px;border-collapse:collapse">
            <tr>
              <td class="sf-header" style="padding:0 4px 18px">
                ${renderLogo()}
              </td>
            </tr>
            <tr>
              <td class="sf-card" style="background:${theme.panel};border:1px solid ${theme.border};border-radius:18px;padding:38px;box-shadow:0 20px 50px rgba(11,28,48,.08)">
                <p style="margin:0 0 12px;color:${theme.brand};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:12px;font-weight:900;line-height:1.35;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(eyebrow || PRODUCT_NAME)}</p>
                <h1 class="sf-title" style="margin:0 0 16px;color:${theme.ink};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:32px;font-weight:900;line-height:1.12;letter-spacing:0">${escapeHtml(title || subject)}</h1>
                ${content}
              </td>
            </tr>
            <tr>
              <td class="sf-footer" style="padding:20px 8px 0;color:${theme.subtle};font-family:'Plus Jakarta Sans','Inter','Segoe UI',Arial,sans-serif;font-size:12px;font-weight:600;line-height:1.65;text-align:center">
                ${escapeHtml(footerNote || SUPPORT_LINE)}<br />
                ${escapeHtml(PRODUCT_NAME)} &copy; ${new Date().getUTCFullYear()}
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
    eyebrow: "Notification",
    title: subject,
    intro,
    actionUrl: data.actionUrl,
    actionLabel: data.actionLabel,
    supportingContent: infoBox(
      "Why you received this",
      "This transactional message was sent because of activity in your ServiceFlow account or workspace."
    )
  });
}

function renderInvitationTemplate(data) {
  const businessName = data.businessName || "a ServiceFlow workspace";
  const roleLabel = humanize(data.role, "team member");
  const inviterName =
    data.inviterName || data.invitedByName || data.inviterEmail || "A workspace admin";

  return renderLayout({
    subject: data.subject || `Join ${businessName} on ServiceFlow`,
    preheader: `${inviterName} invited you to join ${businessName}.`,
    eyebrow: "Team invitation",
    title: `Join ${businessName}`,
    intro: `${inviterName} invited you to join ${businessName} on ServiceFlow as ${roleLabel}.`,
    actionUrl: data.actionUrl,
    actionLabel: data.actionLabel || "Accept invitation",
    supportingContent: joinHtml([
      detailTable(
        [
          ["Business", businessName],
          ["Inviter", inviterName],
          ["Role", roleLabel],
          ["Expires", data.expiresIn || "7 days"]
        ],
        "Invitation summary"
      ),
      infoBox(
        "What happens next",
        "Accepting the invitation connects your account to the workspace so you can collaborate on bookings, services, customers, and daily operations."
      )
    ])
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
        "We received a request to reset your ServiceFlow password. Use the secure button below to choose a new password.",
      actionUrl: data.resetUrl || data.actionUrl,
      actionLabel: data.actionLabel || "Reset password",
      supportingContent: joinHtml([
        detailTable(
          [
            ["Expires", data.expiresIn || "1 hour"],
            ["Account", data.email]
          ],
          "Reset details"
        ),
        infoBox(
          "Security notice",
          "If you did not request this password reset, ignore this email. Your current password will stay unchanged.",
          "warning"
        )
      ])
    }),
  "email-verification": (data) =>
    renderLayout({
      subject: data.subject || "Verify your ServiceFlow email",
      preheader: "Confirm your ServiceFlow email address.",
      eyebrow: "Email verification",
      title: "Verify your email",
      intro:
        "Confirm this email address to secure your ServiceFlow account and connect customer booking history that belongs to you.",
      actionUrl: data.verificationUrl || data.actionUrl,
      actionLabel: data.actionLabel || "Verify email",
      supportingContent: joinHtml([
        detailTable(
          [
            ["Expires", data.expiresIn || "24 hours"],
            ["Account", data.email]
          ],
          "Verification details"
        ),
        infoBox(
          "Did not create an account?",
          "You can safely ignore this email. The verification link only works for the account that requested it.",
          "warning"
        )
      ])
    }),
  "team-invitation": renderInvitationTemplate,
  "business-invitation": renderInvitationTemplate,
  otp: (data) =>
    renderLayout({
      subject: data.subject || "Your ServiceFlow verification code",
      preheader: "Use this one-time code to continue in ServiceFlow.",
      eyebrow: "One-time passcode",
      title: "Your verification code",
      intro:
        "Enter this code in ServiceFlow to finish your secure sign-in or verification step.",
      supportingContent: joinHtml([
        otpBlock(data.otp || data.code || data.otpCode),
        detailTable(
          [
            ["Expires", data.expiresIn || "10 minutes"],
            ["Account", data.email]
          ],
          "Code details"
        ),
        infoBox(
          "Security reminder",
          "Never share this code. ServiceFlow support will never ask you for a one-time passcode.",
          "warning"
        )
      ])
    }),
  "one-time-password": (data) => templateRenderers.otp(data),
  welcome: (data) => {
    const firstName = data.userName ? String(data.userName).split(" ")[0] : "there";

    return renderLayout({
      subject: data.subject || "Welcome to ServiceFlow",
      preheader: "Your ServiceFlow account is ready.",
      eyebrow: "Welcome",
      title: "Welcome to ServiceFlow",
      intro: `Hi ${firstName}, your ServiceFlow workspace is ready to organize bookings, services, customers, billing, and team operations.`,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "Set up your workspace",
      supportingContent: stepList([
        "Add your services and availability.",
        "Invite team members who help manage bookings.",
        "Turn on customer notifications when your workspace is ready."
      ])
    });
  },
  "booking-confirmation": (data) =>
    renderLayout({
      subject: data.subject || "Your booking is confirmed",
      preheader: "Your booking details are inside.",
      eyebrow: "Booking",
      title: data.statusLabel || "Booking confirmed",
      intro: `${data.customerName || "Your"} ${data.serviceName || "appointment"} is scheduled${data.appointment ? ` for ${data.appointment}` : ""}.`,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "Manage booking",
      supportingContent: detailTable(
        [
          ["Business", data.businessName],
          ["Service", data.serviceName],
          ["When", data.appointment],
          ["Reference", data.bookingNumber]
        ],
        "Booking details"
      )
    }),
  "booking-cancellation": (data) =>
    renderLayout({
      subject: data.subject || "Booking canceled",
      preheader: "A booking has been canceled.",
      eyebrow: "Booking update",
      title: data.statusLabel || "Booking canceled",
      intro: `${data.serviceName || "The booking"}${data.appointment ? ` scheduled for ${data.appointment}` : ""} has been canceled.`,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "View booking",
      supportingContent: joinHtml([
        detailTable(
          [
            ["Business", data.businessName],
            ["Service", data.serviceName],
            ["When", data.appointment],
            ["Reference", data.bookingNumber],
            ["Customer", data.customerName]
          ],
          "Cancellation details"
        ),
        infoBox(
          "Need to follow up?",
          "If this cancellation looks wrong, open the booking record in ServiceFlow or contact the business directly.",
          "warning"
        )
      ])
    }),
  "booking-reminder": (data) =>
    renderLayout({
      subject: data.subject || "Upcoming booking reminder",
      preheader: "Your appointment is coming up.",
      eyebrow: "Reminder",
      title: "Your appointment is coming up",
      intro: `This is a reminder for ${data.serviceName || "your appointment"}${data.appointment ? ` on ${data.appointment}` : ""}.`,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "View booking",
      supportingContent: detailTable(
        [
          ["Business", data.businessName],
          ["Service", data.serviceName],
          ["When", data.appointment],
          ["Reference", data.bookingNumber]
        ],
        "Appointment details"
      )
    }),
  "subscription-upgrade": (data) =>
    renderLayout({
      subject: data.subject || "Subscription updated",
      preheader: "Your subscription has been updated.",
      eyebrow: "Billing",
      title: "Subscription updated",
      intro: `Your ${data.planName || "ServiceFlow"} plan is now active.`,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "Open billing",
      supportingContent: infoBox(
        "Plan access",
        "Your workspace now has access to the features included with the current plan."
      )
    }),
  "subscription-downgrade": (data) =>
    renderLayout({
      subject: data.subject || "Subscription changed",
      preheader: "Your subscription status changed.",
      eyebrow: "Billing",
      title: "Subscription changed",
      intro:
        data.message ||
        `Your ${data.planName || "ServiceFlow"} subscription status changed.`,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "Review billing",
      supportingContent: infoBox(
        "Workspace access",
        "Review billing settings to keep your workspace aligned with your plan.",
        "warning"
      )
    }),
  "payment-success": (data) =>
    renderLayout({
      subject: data.subject || "Payment received",
      preheader: "Your payment was successful.",
      eyebrow: "Payment",
      title: "Payment received",
      intro:
        data.message ||
        `Your payment for ${data.planName || "ServiceFlow"} was received successfully.`,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "View billing",
      supportingContent: detailTable(
        [
          ["Plan", data.planName],
          ["Business", data.businessName]
        ],
        "Payment details"
      )
    }),
  "payment-failure": (data) =>
    renderLayout({
      subject: data.subject || "Payment failed",
      preheader: "Update your payment method to avoid interruption.",
      eyebrow: "Payment required",
      title: "Payment failed",
      intro: data.message || "We could not process your subscription payment.",
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "Update payment method",
      supportingContent: infoBox(
        "Action needed",
        "Update your billing method so ServiceFlow can keep your workspace active.",
        "danger"
      )
    }),
  "membership-confirmation": (data) =>
    renderLayout({
      subject: data.subject || "Your membership is active",
      preheader: "Your membership details are inside.",
      eyebrow: "Membership",
      title: "Membership active",
      intro: `${data.customerName || "Your"} membership${data.planName ? ` for ${data.planName}` : ""} is active.`,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "View membership",
      supportingContent: detailTable(
        [
          ["Business", data.businessName],
          ["Plan", data.planName],
          ["Status", data.statusLabel || "Active"],
          ["Renews", data.renewsAt]
        ],
        "Membership details"
      )
    }),
  "membership-cancellation": (data) =>
    renderLayout({
      subject: data.subject || "Membership canceled",
      preheader: "A membership has been canceled.",
      eyebrow: "Membership update",
      title: "Membership canceled",
      intro: `${data.planName || "The membership"} has been canceled${data.endsAt ? ` and remains active until ${data.endsAt}` : ""}.`,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "View membership",
      supportingContent: detailTable(
        [
          ["Business", data.businessName],
          ["Plan", data.planName],
          ["Status", data.statusLabel || "Canceled"],
          ["Ends", data.endsAt]
        ],
        "Membership details"
      )
    }),
  "review-submitted": (data) =>
    renderLayout({
      subject: data.subject || "New ServiceFlow review",
      preheader: "A new customer review was submitted.",
      eyebrow: "Review",
      title: "New review submitted",
      intro: data.message || "A new customer review is waiting for moderation.",
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || "Moderate review",
      supportingContent: detailTable(
        [
          ["Rating", data.rating ? `${data.rating} stars` : null],
          ["Booking", data.bookingNumber],
          ["Business", data.businessName]
        ],
        "Review details"
      )
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
      actionLabel: data.actionLabel || "Open ServiceFlow",
      supportingContent: infoBox(
        "Diagnostic message",
        "This email checks delivery configuration only. No user data or workflow logic changed."
      )
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
    inviterName: "Jordan Lee",
    serviceName: "Strategy session",
    appointment: "Thursday, June 18, 2026 at 9:00 AM",
    bookingNumber: "SF-1024",
    role: "ADMIN",
    rating: 5,
    planName: "Pro",
    statusLabel: "Active",
    renewsAt: "July 18, 2026",
    endsAt: "July 18, 2026",
    otpCode: "482913",
    email: "alex@example.com",
    actionUrl: "https://example.com/dashboard",
    actionLabel: "Open ServiceFlow",
    expiresIn: "7 days"
  };

  return renderEmailTemplate(templateName, sample);
}
