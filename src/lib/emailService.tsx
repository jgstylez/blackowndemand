/**
 * Email Service
 *
 * This module provides functions for sending emails through Supabase Edge Functions.
 */

import {
  PRIMARY_SUPPORT_EMAIL,
  SECONDARY_SUPPORT_EMAIL,
  NOREPLY_EMAIL,
} from "./emailConfig";
import { callEdgeFunction } from "./edgeFunctions";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * Sends an email using the Supabase Edge Function
 *
 * @param options Email options including recipient, subject, and content
 * @returns Promise resolving to the response from the edge function
 */
export const sendEmail = async (options: EmailOptions) => {
  try {
    return await callEdgeFunction<{ success: boolean }>({
      functionName: "send-email",
      payload: {
        from: `BlackOWNDemand <${NOREPLY_EMAIL}>`, // now explicitly using no-reply
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || PRIMARY_SUPPORT_EMAIL,
        cc: options.cc || [],
        bcc: options.bcc || [SECONDARY_SUPPORT_EMAIL],
      },
    });
  } catch (error) {
    console.error("Email service error:", error);
    throw error;
  }
};

/**
 * Sends a contact form submission email
 *
 * @param name Sender's name
 * @param email Sender's email
 * @param subject Email subject
 * @param message Email message
 * @param category Optional category
 * @returns Promise resolving to the response from sendEmail
 */
export const sendContactFormEmail = async (
  name: string,
  email: string,
  subject: string,
  message: string,
  category?: string
) => {
  return await callEdgeFunction<{ success: boolean }>({
    functionName: "send-contact-email",
    payload: {
      name,
      email,
      subject,
      message,
      category,
    },
  });
};

/**
 * Sends a welcome email to a new user
 *
 * @param userEmail User's email address
 * @param firstName User's first name (optional)
 * @returns Promise resolving to the response from sendEmail
 */
export const sendWelcomeEmail = async (
  userEmail: string,
  firstName?: string
) => {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

  const htmlContent = `
    <h2>Welcome to BlackOWNDemand!</h2>
    <p>${greeting}</p>
    <p>Thank you for joining our community. We're excited to have you with us!</p>
    <p>With your new account, you can:</p>
    <ul>
      <li>List your business in our directory</li>
      <li>Connect with other Black-owned businesses</li>
      <li>Access exclusive resources and tools</li>
    </ul>
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    <p>Best regards,<br>The BlackOWNDemand Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: "Welcome to BlackOWNDemand!",
    html: htmlContent,
  });
};

/**
 * Sends a payment confirmation email to a user
 *
 * @param userEmail User's email address
 * @param amount Payment amount
 * @param description Description of the purchase
 * @param planName Name of the subscription plan (optional)
 * @param transactionId Transaction ID for record keeping (optional)
 * @param paymentMethodLast4 Last 4 digits of payment method (optional)
 * @param nextBillingDate Next billing date for recurring payments (optional)
 * @returns Promise resolving to the response from sendEmail
 */
export const sendPaymentConfirmationEmail = async (
  userEmail: string,
  amount: number,
  description: string,
  planName?: string,
  transactionId?: string,
  paymentMethodLast4?: string,
  nextBillingDate?: string
) => {
  const formattedAmount = amount.toFixed(2);
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate next billing date if not provided
  const nextBilling =
    nextBillingDate ||
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

  const htmlContent = `
    <h2>Payment Confirmation</h2>
    <p>Thank you for your payment to BlackOWNDemand!</p>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Payment Details</h3>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Amount:</strong> $${formattedAmount}</p>
      <p><strong>Description:</strong> ${description}</p>
      ${planName ? `<p><strong>Plan:</strong> ${planName}</p>` : ""}
      ${
        transactionId
          ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>`
          : ""
      }
      ${
        paymentMethodLast4
          ? `<p><strong>Payment Method:</strong> ****${paymentMethodLast4}</p>`
          : ""
      }
      <p><strong>Next Billing Date:</strong> ${nextBilling}</p>
    </div>
    
    <p>Your payment has been processed successfully. You can now proceed with setting up your business listing.</p>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    
    <p>Thank you for choosing BlackOWNDemand to showcase your business!</p>
    
    <p>Best regards,<br>The BlackOWNDemand Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: "Payment Confirmation - BlackOWNDemand",
    html: htmlContent,
  });
};

/**
 * Sends an account deletion confirmation email to a user
 *
 * @param userEmail User's email address
 * @param firstName User's first name (optional)
 * @param lastName User's last name (optional)
 * @returns Promise resolving to the response from the edge function
 */
export const sendAccountDeletionEmail = async (
  userEmail: string,
  firstName?: string,
  lastName?: string
) => {
  return await callEdgeFunction<{ success: boolean }>({
    functionName: "send-account-deletion-email",
    payload: {
      email: userEmail,
      firstName,
      lastName,
    },
  });
};

/**
 * Sends a business deactivation notification email
 *
 * @param userEmail User's email address
 * @param businessName Name of the deactivated business
 * @param deactivationReason Reason for deactivation (optional)
 * @param reactivationInstructions Instructions for reactivation (optional)
 * @returns Promise resolving to the response from sendEmail
 */
export const sendBusinessDeactivationEmail = async (
  userEmail: string,
  businessName: string,
  deactivationReason?: string,
  reactivationInstructions?: string
) => {
  const htmlContent = `
    <h2>Business Deactivation Notice</h2>
    <p>Dear Business Owner,</p>
    
    <p>We regret to inform you that your business listing <strong>"${businessName}"</strong> has been deactivated on BlackOWNDemand.</p>
    
    ${
      deactivationReason
        ? `<p><strong>Reason:</strong> ${deactivationReason}</p>`
        : ""
    }
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0;">What this means:</h3>
      <ul>
        <li>Your business is no longer visible to customers</li>
        <li>You will not receive new inquiries or bookings</li>
        <li>Your subscription has been paused</li>
      </ul>
    </div>
    
    ${
      reactivationInstructions
        ? `
      <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0;">How to Reactivate:</h3>
        <p>${reactivationInstructions}</p>
      </div>
    `
        : ""
    }
    
    <p>If you believe this deactivation was made in error, or if you have any questions, please contact our support team immediately.</p>
    
    <p>We're here to help you get your business back online as quickly as possible.</p>
    
    <p>Best regards,<br>The BlackOWNDemand Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Business Deactivation Notice - ${businessName}`,
    html: htmlContent,
  });
};

/**
 * Sends a subscription cancellation confirmation email
 *
 * @param userEmail User's email address
 * @param businessName Name of the business
 * @param planName Name of the cancelled plan
 * @param cancellationDate Date of cancellation
 * @param endDate Date when subscription ends
 * @param refundAmount Refund amount if applicable (optional)
 * @returns Promise resolving to the response from sendEmail
 */
export const sendSubscriptionCancellationEmail = async (
  userEmail: string,
  businessName: string,
  planName: string,
  cancellationDate: string,
  endDate: string,
  refundAmount?: number
) => {
  const formattedRefund = refundAmount ? refundAmount.toFixed(2) : null;

  const htmlContent = `
    <h2>Subscription Cancellation Confirmation</h2>
    <p>Dear Business Owner,</p>
    
    <p>We've received your request to cancel your subscription for <strong>"${businessName}"</strong>.</p>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Cancellation Details</h3>
      <p><strong>Business:</strong> ${businessName}</p>
      <p><strong>Plan:</strong> ${planName}</p>
      <p><strong>Cancellation Date:</strong> ${cancellationDate}</p>
      <p><strong>Service End Date:</strong> ${endDate}</p>
      ${
        formattedRefund
          ? `<p><strong>Refund Amount:</strong> $${formattedRefund}</p>`
          : ""
      }
    </div>
    
    <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Important Information</h3>
      <ul>
        <li>Your business will remain active until ${endDate}</li>
        <li>You can reactivate your subscription at any time</li>
        <li>Your business data and settings will be preserved</li>
        ${
          formattedRefund
            ? `<li>Refund will be processed within 5-10 business days</li>`
            : ""
        }
      </ul>
    </div>
    
    <p>If you change your mind, you can reactivate your subscription by logging into your account and updating your payment information.</p>
    
    <p>Thank you for being part of the BlackOWNDemand community. We hope to see you again soon!</p>
    
    <p>Best regards,<br>The BlackOWNDemand Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Subscription Cancellation - ${businessName}`,
    html: htmlContent,
  });
};

/**
 * Sends a subscription change confirmation email
 *
 * @param userEmail User's email address
 * @param businessName Name of the business
 * @param oldPlanName Name of the previous plan
 * @param newPlanName Name of the new plan
 * @param changeType Type of change (upgrade/downgrade)
 * @param effectiveDate Date when changes take effect
 * @param priceDifference Price difference if applicable (optional)
 * @returns Promise resolving to the response from sendEmail
 */
export const sendSubscriptionChangeEmail = async (
  userEmail: string,
  businessName: string,
  oldPlanName: string,
  newPlanName: string,
  changeType: "upgrade" | "downgrade",
  effectiveDate: string,
  priceDifference?: number
) => {
  const formattedPriceDiff = priceDifference
    ? Math.abs(priceDifference).toFixed(2)
    : null;
  const changeAction = changeType === "upgrade" ? "upgraded" : "downgraded";

  const htmlContent = `
    <h2>Subscription ${
      changeType.charAt(0).toUpperCase() + changeType.slice(1)
    } Confirmation</h2>
    <p>Dear Business Owner,</p>
    
    <p>Your subscription for <strong>"${businessName}"</strong> has been successfully ${changeAction}.</p>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Change Details</h3>
      <p><strong>Business:</strong> ${businessName}</p>
      <p><strong>Previous Plan:</strong> ${oldPlanName}</p>
      <p><strong>New Plan:</strong> ${newPlanName}</p>
      <p><strong>Change Type:</strong> ${
        changeType.charAt(0).toUpperCase() + changeType.slice(1)
      }</p>
      <p><strong>Effective Date:</strong> ${effectiveDate}</p>
      ${
        formattedPriceDiff
          ? `<p><strong>Price ${
              changeType === "upgrade" ? "Increase" : "Decrease"
            }:</strong> $${formattedPriceDiff}</p>`
          : ""
      }
    </div>
    
    <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0;">What's Next</h3>
      <ul>
        <li>Your new plan features are now active</li>
        <li>Your next billing cycle will reflect the new pricing</li>
        <li>You can manage your subscription anytime from your dashboard</li>
      </ul>
    </div>
    
    <p>If you have any questions about your new plan or need assistance, please don't hesitate to contact our support team.</p>
    
    <p>Thank you for choosing BlackOWNDemand!</p>
    
    <p>Best regards,<br>The BlackOWNDemand Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Subscription ${
      changeType.charAt(0).toUpperCase() + changeType.slice(1)
    } - ${businessName}`,
    html: htmlContent,
  });
};

/**
 * Sends a payment method update confirmation email
 *
 * @param userEmail User's email address
 * @param businessName Name of the business
 * @param paymentMethodLast4 Last 4 digits of the new payment method
 * @param updateDate Date of the update
 * @returns Promise resolving to the response from sendEmail
 */
export const sendPaymentMethodUpdateEmail = async (
  userEmail: string,
  businessName: string,
  paymentMethodLast4: string,
  updateDate: string
) => {
  const htmlContent = `
    <h2>Payment Method Updated</h2>
    <p>Dear Business Owner,</p>
    
    <p>Your payment method for <strong>"${businessName}"</strong> has been successfully updated.</p>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Update Details</h3>
      <p><strong>Business:</strong> ${businessName}</p>
      <p><strong>New Payment Method:</strong> ****${paymentMethodLast4}</p>
      <p><strong>Update Date:</strong> ${updateDate}</p>
    </div>
    
    <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Security Notice</h3>
      <p>If you did not make this change, please contact our support team immediately. We take the security of your payment information seriously.</p>
    </div>
    
    <p>Your next billing cycle will use this updated payment method. You can manage your payment information anytime from your account dashboard.</p>
    
    <p>If you have any questions, please don't hesitate to contact our support team.</p>
    
    <p>Best regards,<br>The BlackOWNDemand Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Payment Method Updated - ${businessName}`,
    html: htmlContent,
  });
};

export default {
  sendEmail,
  sendContactFormEmail,
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendAccountDeletionEmail,
  sendBusinessDeactivationEmail,
  sendSubscriptionCancellationEmail,
  sendSubscriptionChangeEmail,
  sendPaymentMethodUpdateEmail,
};
