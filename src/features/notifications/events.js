import { sendTransactionalEmail } from "@/features/notifications/email/service";
import { queueNotification } from "@/features/notifications/server";
import { prisma } from "@/lib/prisma";

function getAppUrl(path = "") {
  return `${(process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "")}${path}`;
}

function emailMetadata(template, emailData = {}, emailActionLabel = null) {
  return {
    emailTemplate: template,
    emailData,
    ...(emailActionLabel ? { emailActionLabel } : {})
  };
}

function throwIfSkippedEmail(result) {
  if (!result.skipped) {
    return;
  }

  const error = new Error(result.reason);
  error.deliverySkipped = true;
  error.details = {
    configuration: result.configuration || null
  };

  throw error;
}

export async function notifyTeamInvitation({
  invitation,
  business,
  token
}) {
  const actionUrl = getAppUrl(
    `/invite/accept?token=${encodeURIComponent(token)}`
  );

  await Promise.all([
    queueNotification({
      businessId: business.id,
      dedupeKey: `team-invitation:${invitation.id}:${invitation.updatedAt.toISOString()}:business:in-app`,
      type: "TEAM_INVITATION",
      audience: "BUSINESS",
      channel: "IN_APP",
      title: "Team invitation sent",
      message: `${invitation.email} was invited as ${invitation.role.toLowerCase()}.`,
      actionUrl: getAppUrl("/dashboard/team"),
      metadata: {
        invitationId: invitation.id,
        email: invitation.email,
        role: invitation.role
      }
    }),
    queueNotification({
      businessId: business.id,
      dedupeKey: `team-invitation:${invitation.id}:${invitation.updatedAt.toISOString()}:team:email`,
      type: "TEAM_INVITATION",
      audience: "TEAM",
      channel: "EMAIL",
      recipientEmail: invitation.email,
      title: `Join ${business.name} on ServiceFlow`,
      message: `You have been invited to join ${business.name} as ${invitation.role.toLowerCase()}. This invitation expires in 7 days.`,
      actionUrl,
      metadata: {
        invitationId: invitation.id,
        role: invitation.role,
        ...emailMetadata(
          "team-invitation",
          {
            businessName: business.name,
            role: invitation.role,
            expiresIn: "7 days"
          },
          "Accept invitation"
        )
      }
    })
  ]);
}

export async function notifyWelcomeUser({ user }) {
  if (!user?.email) {
    return null;
  }

  const result = await sendTransactionalEmail({
    to: user.email,
    subject: "Welcome to ServiceFlow",
    message: "Your ServiceFlow account is ready.",
    actionUrl: getAppUrl("/onboarding"),
    actionLabel: "Set up your workspace",
    idempotencyKey: `welcome:${user.id}`,
    template: "welcome",
    templateData: {
      userName: user.name,
      actionUrl: getAppUrl("/onboarding")
    }
  });

  throwIfSkippedEmail(result);

  return result;
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
  tokenHash
}) {
  const result = await sendTransactionalEmail({
    to: email,
    subject: "Reset your ServiceFlow password",
    message:
      "Use the secure link below to reset your password. This link expires in one hour.",
    actionUrl: resetUrl,
    actionLabel: "Reset password",
    idempotencyKey: `password-reset:${tokenHash}`,
    template: "password-reset",
    templateData: {
      resetUrl
    }
  });

  throwIfSkippedEmail(result);

  return result;
}

export async function sendEmailVerificationEmail({
  email,
  verificationUrl,
  tokenHash
}) {
  const result = await sendTransactionalEmail({
    to: email,
    subject: "Verify your ServiceFlow email",
    message:
      "Confirm your email address to secure your ServiceFlow customer account.",
    actionUrl: verificationUrl,
    actionLabel: "Verify email",
    idempotencyKey: `email-verification:${tokenHash}`,
    template: "email-verification",
    templateData: {
      verificationUrl
    }
  });

  throwIfSkippedEmail(result);

  return result;
}

export async function notifyTeamMemberJoined({
  business,
  membership
}) {
  await queueNotification({
    businessId: business.id,
    dedupeKey: `team-member:${membership.id}:joined:business:in-app`,
    type: "TEAM_MEMBER_JOINED",
    audience: "BUSINESS",
    channel: "IN_APP",
    title: "Team member joined",
    message: `${membership.user.name || membership.user.email} joined as ${membership.role.toLowerCase()}.`,
    actionUrl: getAppUrl("/dashboard/team"),
    metadata: {
      membershipId: membership.id,
      userId: membership.userId,
      role: membership.role
    }
  });
}

function formatAppointment(value, timezone) {
  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    dateStyle: "full",
    timeStyle: "short"
  }).format(new Date(value));
}

function bookingTypeForStatus(status) {
  return {
    CONFIRMED: "BOOKING_CONFIRMED",
    CANCELED: "BOOKING_CANCELED",
    COMPLETED: "BOOKING_COMPLETED",
    NO_SHOW: "BOOKING_NO_SHOW"
  }[status];
}

function bookingEmailTemplateForStatus(status) {
  if (status === "CONFIRMED") {
    return "booking-confirmation";
  }

  if (status === "CANCELED") {
    return "booking-cancellation";
  }

  return "generic-notification";
}

async function getBusinessNotificationRecipient(businessId) {
  return prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      owner: {
        select: {
          email: true
        }
      }
    }
  });
}

async function getCustomerNotificationPreferences(customerId) {
  if (!customerId) {
    return {
      emailNotifications: true,
      bookingReminders: true
    };
  }

  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId
    },
    select: {
      user: {
        select: {
          customerEmailNotifications: true,
          customerBookingReminders: true
        }
      }
    }
  });

  return {
    emailNotifications:
      customer?.user?.customerEmailNotifications ?? true,
    bookingReminders:
      customer?.user?.customerBookingReminders ?? true
  };
}

export async function notifyReviewSubmitted({
  business,
  booking,
  review
}) {
  const recipient = await getBusinessNotificationRecipient(business.id);

  if (!recipient) {
    return;
  }

  const recipientEmail =
    recipient.email || recipient.owner?.email || null;
  const message = `${booking.customerName} submitted a ${review.rating}-star review for ${booking.serviceNameSnapshot}.`;

  await Promise.all([
    queueNotification({
      businessId: business.id,
      bookingId: booking.id,
      dedupeKey: `review:${review.id}:submitted:business:in-app`,
      type: "REVIEW_SUBMITTED",
      audience: "BUSINESS",
      channel: "IN_APP",
      title: "New review awaiting moderation",
      message,
      actionUrl: getAppUrl("/dashboard/reviews"),
      metadata: {
        reviewId: review.id,
        rating: review.rating,
        bookingNumber: booking.bookingNumber
      }
    }),
    queueNotification({
      businessId: business.id,
      bookingId: booking.id,
      dedupeKey: `review:${review.id}:submitted:business:email`,
      type: "REVIEW_SUBMITTED",
      audience: "BUSINESS",
      channel: "EMAIL",
      recipientEmail,
      title: "New ServiceFlow review",
      message,
      actionUrl: getAppUrl("/dashboard/reviews"),
      metadata: {
        reviewId: review.id,
        rating: review.rating,
        bookingNumber: booking.bookingNumber,
        ...emailMetadata(
          "review-submitted",
          {
            rating: review.rating,
            bookingNumber: booking.bookingNumber
          },
          "Moderate review"
        )
      }
    })
  ]);
}

export async function notifyBookingCreated({
  booking,
  customerAccessToken = null
}) {
  const business = await getBusinessNotificationRecipient(booking.businessId);

  if (!business) {
    return;
  }

  const appointment = formatAppointment(booking.startsAt, booking.timezone);
  const dashboardUrl = getAppUrl("/dashboard/bookings");
  const manageBookingUrl = customerAccessToken
    ? getAppUrl(
        `/${encodeURIComponent(business.slug)}/booking/${encodeURIComponent(booking.bookingNumber)}?token=${encodeURIComponent(customerAccessToken)}`
      )
    : null;
  const customerPreferences =
    await getCustomerNotificationPreferences(booking.customerId);
  const notifications = [
    queueNotification({
      businessId: booking.businessId,
      bookingId: booking.id,
      dedupeKey: `booking:${booking.id}:created:business:in-app`,
      type: "BOOKING_CREATED",
      audience: "BUSINESS",
      channel: "IN_APP",
      title: "New booking received",
      message: `${booking.customerName} booked ${booking.serviceNameSnapshot} for ${appointment}.`,
      actionUrl: dashboardUrl,
      metadata: {
        bookingNumber: booking.bookingNumber
      }
    })
  ];

  if (customerPreferences.emailNotifications) {
    notifications.push(
      queueNotification({
        businessId: booking.businessId,
        bookingId: booking.id,
        dedupeKey: `booking:${booking.id}:created:customer:email`,
        type: "BOOKING_CREATED",
        audience: "CUSTOMER",
        channel: "EMAIL",
        recipientEmail: booking.customerEmail,
        title:
          booking.status === "CONFIRMED"
            ? "Your booking is confirmed"
            : "Your booking request was received",
        message: `${booking.customerName}, your ${booking.serviceNameSnapshot} appointment is scheduled for ${appointment}. Reference: ${booking.bookingNumber}.`,
        actionUrl: manageBookingUrl,
        metadata: {
          bookingNumber: booking.bookingNumber,
          ...emailMetadata(
            "booking-confirmation",
            {
              customerName: booking.customerName,
              serviceName: booking.serviceNameSnapshot,
              appointment,
              bookingNumber: booking.bookingNumber,
              businessName: business.name,
              statusLabel:
                booking.status === "CONFIRMED"
                  ? "Booking confirmed"
                  : "Booking request received"
            },
            "Manage booking"
          )
        }
      })
    );
  }

  await Promise.all(notifications);
}

export async function notifyBookingStatusChanged({ booking }) {
  const type = bookingTypeForStatus(booking.status);

  if (!type) {
    return;
  }

  const business = await getBusinessNotificationRecipient(booking.businessId);

  if (!business) {
    return;
  }

  const appointment = formatAppointment(booking.startsAt, booking.timezone);
  const statusLabel = booking.status.toLowerCase().replaceAll("_", " ");
  const customerPreferences =
    await getCustomerNotificationPreferences(booking.customerId);
  const notifications = [
    queueNotification({
      businessId: booking.businessId,
      bookingId: booking.id,
      dedupeKey: `booking:${booking.id}:${booking.status}:business:in-app`,
      type,
      audience: "BUSINESS",
      channel: "IN_APP",
      title: `Booking ${statusLabel}`,
      message: `${booking.customerName}'s ${booking.serviceNameSnapshot} booking for ${appointment} was marked ${statusLabel}.`,
      actionUrl: getAppUrl("/dashboard/bookings"),
      metadata: {
        bookingNumber: booking.bookingNumber,
        status: booking.status
      }
    })
  ];

  if (customerPreferences.emailNotifications) {
    notifications.push(
      queueNotification({
        businessId: booking.businessId,
        bookingId: booking.id,
        dedupeKey: `booking:${booking.id}:${booking.status}:customer:email`,
        type,
        audience: "CUSTOMER",
        channel: "EMAIL",
        recipientEmail: booking.customerEmail,
        title: `Booking ${statusLabel}`,
        message: `Your ${booking.serviceNameSnapshot} booking for ${appointment} is now ${statusLabel}. Reference: ${booking.bookingNumber}.`,
        metadata: {
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          ...emailMetadata(
            bookingEmailTemplateForStatus(booking.status),
            {
              customerName: booking.customerName,
              serviceName: booking.serviceNameSnapshot,
              appointment,
              bookingNumber: booking.bookingNumber,
              businessName: business.name,
              statusLabel: `Booking ${statusLabel}`
            },
            booking.status === "CANCELED" ? "View booking" : "Manage booking"
          )
        }
      })
    );
  }

  await Promise.all(notifications);
}

export async function notifyCustomerCanceledBooking({ booking }) {
  const business = await getBusinessNotificationRecipient(booking.businessId);

  if (!business) {
    return;
  }

  const appointment = formatAppointment(booking.startsAt, booking.timezone);
  const recipientEmail = business.email || business.owner?.email || null;
  const customerPreferences =
    await getCustomerNotificationPreferences(booking.customerId);
  const notifications = [
    queueNotification({
      businessId: booking.businessId,
      bookingId: booking.id,
      dedupeKey: `booking:${booking.id}:customer-canceled:business:in-app`,
      type: "BOOKING_CANCELED",
      audience: "BUSINESS",
      channel: "IN_APP",
      title: "Customer canceled a booking",
      message: `${booking.customerName} canceled ${booking.serviceNameSnapshot} scheduled for ${appointment}.`,
      actionUrl: getAppUrl("/dashboard/bookings"),
      metadata: {
        bookingNumber: booking.bookingNumber
      }
    }),
    queueNotification({
      businessId: booking.businessId,
      bookingId: booking.id,
      dedupeKey: `booking:${booking.id}:customer-canceled:business:email`,
      type: "BOOKING_CANCELED",
      audience: "BUSINESS",
      channel: "EMAIL",
      recipientEmail,
      title: "Customer canceled a booking",
      message: `${booking.customerName} canceled ${booking.serviceNameSnapshot} scheduled for ${appointment}. Reference: ${booking.bookingNumber}.`,
      actionUrl: getAppUrl("/dashboard/bookings"),
      metadata: {
        bookingNumber: booking.bookingNumber,
        ...emailMetadata(
          "booking-cancellation",
          {
            customerName: booking.customerName,
            serviceName: booking.serviceNameSnapshot,
            appointment,
            bookingNumber: booking.bookingNumber,
            businessName: business.name
          },
          "View booking"
        )
      }
    })
  ];

  if (customerPreferences.emailNotifications) {
    notifications.push(
      queueNotification({
        businessId: booking.businessId,
        bookingId: booking.id,
        dedupeKey: `booking:${booking.id}:customer-canceled:customer:email`,
        type: "BOOKING_CANCELED",
        audience: "CUSTOMER",
        channel: "EMAIL",
        recipientEmail: booking.customerEmail,
        title: "Your booking was canceled",
        message: `Your ${booking.serviceNameSnapshot} booking scheduled for ${appointment} has been canceled. Reference: ${booking.bookingNumber}.`,
        metadata: {
          bookingNumber: booking.bookingNumber,
          ...emailMetadata(
            "booking-cancellation",
            {
              customerName: booking.customerName,
              serviceName: booking.serviceNameSnapshot,
              appointment,
              bookingNumber: booking.bookingNumber,
              businessName: business.name
            },
            "View booking"
          )
        }
      })
    );
  }

  await Promise.all(notifications);
}

export async function notifyBookingReminder({
  business,
  booking,
  customerAccessToken = null
}) {
  const customerPreferences =
    await getCustomerNotificationPreferences(booking.customerId);

  if (
    !customerPreferences.emailNotifications ||
    !customerPreferences.bookingReminders
  ) {
    return null;
  }

  const appointment = formatAppointment(booking.startsAt, booking.timezone);
  const actionUrl = customerAccessToken
    ? getAppUrl(
        `/${encodeURIComponent(business.slug)}/booking/${encodeURIComponent(booking.bookingNumber)}?token=${encodeURIComponent(customerAccessToken)}`
      )
    : null;

  return queueNotification({
    businessId: booking.businessId,
    bookingId: booking.id,
    dedupeKey: `booking:${booking.id}:reminder:customer:email`,
    type: "BOOKING_CONFIRMED",
    audience: "CUSTOMER",
    channel: "EMAIL",
    recipientEmail: booking.customerEmail,
    title: "Upcoming booking reminder",
    message: `Reminder: your ${booking.serviceNameSnapshot} booking is scheduled for ${appointment}. Reference: ${booking.bookingNumber}.`,
    actionUrl,
    metadata: {
      bookingNumber: booking.bookingNumber,
      ...emailMetadata(
        "booking-reminder",
        {
          customerName: booking.customerName,
          serviceName: booking.serviceNameSnapshot,
          appointment,
          bookingNumber: booking.bookingNumber,
          businessName: business.name
        },
        "View booking"
      )
    }
  });
}

function subscriptionTemplateForType(type) {
  return {
    PAYMENT_SUCCEEDED: "payment-success",
    PAYMENT_FAILED: "payment-failure",
    SUBSCRIPTION_ACTIVE: "subscription-upgrade",
    SUBSCRIPTION_CANCELED: "subscription-downgrade",
    SUBSCRIPTION_PAST_DUE: "subscription-downgrade"
  }[type] || "generic-notification";
}

export async function notifySubscriptionEvent({
  businessId,
  subscriptionId,
  eventId,
  type,
  title,
  message
}) {
  const business = await getBusinessNotificationRecipient(businessId);

  if (!business) {
    return;
  }

  const recipientEmail = business.email || business.owner?.email || null;

  await Promise.all([
    queueNotification({
      businessId,
      subscriptionId,
      dedupeKey: `stripe:${eventId}:business:in-app`,
      type,
      audience: "BUSINESS",
      channel: "IN_APP",
      title,
      message,
      actionUrl: getAppUrl("/dashboard/billing"),
      metadata: {
        stripeEventId: eventId
      }
    }),
    queueNotification({
      businessId,
      subscriptionId,
      dedupeKey: `stripe:${eventId}:business:email`,
      type,
      audience: "BUSINESS",
      channel: "EMAIL",
      recipientEmail,
      title,
      message,
      actionUrl: getAppUrl("/dashboard/billing"),
      metadata: {
        stripeEventId: eventId,
        ...emailMetadata(
          subscriptionTemplateForType(type),
          {
            message,
            planName: message.match(/the ([a-z]+) plan/i)?.[1] || null
          },
          type === "PAYMENT_FAILED" ? "Update payment method" : "Open billing"
        )
      }
    })
  ]);
}

export async function sendEmailDiagnostic({
  recipient,
  baseUrl = null,
  userId
}) {
  const result = await sendTransactionalEmail({
    to: recipient,
    subject: "ServiceFlow email delivery diagnostic",
    message:
      "Nodemailer accepted this ServiceFlow diagnostic message. Receiving it confirms the configured SMTP sender can deliver to this address.",
    actionUrl: baseUrl,
    actionLabel: "Open ServiceFlow",
    idempotencyKey: `email-diagnostic:${userId}:${Date.now()}`,
    template: "diagnostic",
    templateData: {
      actionUrl: baseUrl
    }
  });

  throwIfSkippedEmail(result);

  return result;
}
