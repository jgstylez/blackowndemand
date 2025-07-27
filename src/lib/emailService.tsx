/**
 * Email Service
 * 
 * This module provides functions for sending emails through Supabase Edge Functions.
 */

import { PRIMARY_SUPPORT_EMAIL, SECONDARY_SUPPORT_EMAIL, NOREPLY_EMAIL } from './emailConfig';
import { callEdgeFunction } from './edgeFunctions';

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
      functionName: 'send-email',
      payload: {
        from: `BlackOWNDemand <${NOREPLY_EMAIL}>`, // now explicitly using no-reply
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || PRIMARY_SUPPORT_EMAIL,
        cc: options.cc || [],
        bcc: options.bcc || [SECONDARY_SUPPORT_EMAIL]
      }
    });
  } catch (error) {
    console.error('Email service error:', error);
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
  return await callEdgeFunction<{success: boolean}>({
    functionName: 'send-contact-email',
    payload: {
      name,
      email,
      subject,
      message,
      category
    }
  });
};

/**
 * Sends a welcome email to a new user
 * 
 * @param userEmail User's email address
 * @param firstName User's first name (optional)
 * @returns Promise resolving to the response from sendEmail
 */
export const sendWelcomeEmail = async (userEmail: string, firstName?: string) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
  
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
    subject: 'Welcome to BlackOWNDemand!',
    html: htmlContent
  });
};

/**
 * Sends a payment confirmation email to a user
 * 
 * @param userEmail User's email address
 * @param amount Payment amount
 * @param description Description of the purchase
 * @param planName Name of the subscription plan (optional)
 * @returns Promise resolving to the response from sendEmail
 */
export const sendPaymentConfirmationEmail = async (
  userEmail: string,
  amount: number,
  description: string,
  planName?: string
) => {
  const formattedAmount = amount.toFixed(2);
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const htmlContent = `
    <h2>Payment Confirmation</h2>
    <p>Thank you for your payment to BlackOWNDemand!</p>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Payment Details</h3>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Amount:</strong> $${formattedAmount}</p>
      <p><strong>Description:</strong> ${description}</p>
      ${planName ? `<p><strong>Plan:</strong> ${planName}</p>` : ''}
    </div>
    
    <p>Your payment has been processed successfully. You can now proceed with setting up your business listing.</p>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    
    <p>Thank you for choosing BlackOWNDemand to showcase your business!</p>
    
    <p>Best regards,<br>The BlackOWNDemand Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Payment Confirmation - BlackOWNDemand',
    html: htmlContent
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
    functionName: 'send-account-deletion-email',
    payload: {
      email: userEmail,
      firstName,
      lastName
    }
  });
};

export default {
  sendEmail,
  sendContactFormEmail,
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendAccountDeletionEmail
};