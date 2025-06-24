/**
 * Email Service
 * 
 * This module provides functions for sending emails through Supabase Edge Functions.
 */

import { PRIMARY_SUPPORT_EMAIL, SECONDARY_SUPPORT_EMAIL } from './emailConfig';
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
    return await callEdgeFunction<{success: boolean}>({
      functionName: 'send-email',
      payload: {
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

export default {
  sendEmail,
  sendContactFormEmail,
  sendWelcomeEmail
};