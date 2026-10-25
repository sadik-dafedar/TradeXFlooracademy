import 'dotenv/config';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Initialize Resend if API key is available
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Create Gmail transporter as fallback
const createGmailTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  // Try Gmail first (more reliable for now)
  const transporter = createGmailTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"TradeX Floor Academy" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log('✅ Email sent via Gmail:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Gmail error:', error.message);
    }
  }

  // Try Resend as backup if Gmail fails
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'TradeX Floor Academy <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('❌ Resend error:', error);
      } else {
        console.log('✅ Email sent via Resend:', data.id);
        return { success: true, messageId: data.id };
      }
    } catch (error) {
      console.error('❌ Resend exception:', error.message);
    }
  }

  // No email service working
  console.error('🚫 No email service working. Email not sent to:', to);
  console.log('--- DEV MODE: Email Content ---');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('-------------------------------');

  if (process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Email service not configured or failed' };
  }

  return { success: true, messageId: 'dev-mode-no-email' };
};

export const sendPasswordResetEmail = async (email, resetLink) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
          <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0; padding: 30px;">
              <tr>
                <td align="center">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    <span style="color: #FF2E63;">TradeX</span><span style="color: #08D9D6;">Floor Academy</span>
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #a0a0a0; font-size: 14px;">Academy</p>
                </td>
              </tr>
            </table>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #1a1a2e; padding: 40px 30px;">
              <tr>
                <td>
                  <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px; font-weight: 600; text-align: center;">
                    🔑 Reset Your Password
                  </h2>
                  <p style="margin: 0 0 30px 0; color: #b0b0b0; font-size: 16px; line-height: 1.6; text-align: center;">
                    Click the button below to create a new password:
                  </p>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #FF2E63 0%, #8B5CF6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0 0; color: #FF2E63; font-size: 14px; text-align: center;">
                    ⏱️ This link expires in <strong>5 minutes</strong>
                  </p>
                </td>
              </tr>
            </table>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #12121a; padding: 20px; border-radius: 0 0 16px 16px;">
              <tr>
                <td align="center">
                  <p style="margin: 0; color: #606060; font-size: 12px;">
                    If you didn't request this, ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject: '🔑 Reset Your TradeX Floor Academy Password', html });
};

export const sendOtpEmail = async (email, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
          <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0; padding: 30px;">
              <tr>
                <td align="center">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    <span style="color: #FF2E63;">TradeX</span><span style="color: #08D9D6;">Floor Academy</span>
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #a0a0a0; font-size: 14px;">Academy</p>
                </td>
              </tr>
            </table>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #1a1a2e; padding: 40px 30px;">
              <tr>
                <td>
                  <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px; font-weight: 600; text-align: center;">
                    🔐 Your Login Code
                  </h2>
                  <p style="margin: 0 0 30px 0; color: #b0b0b0; font-size: 16px; line-height: 1.6; text-align: center;">
                    Enter this code to verify your identity:
                  </p>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <div style="background: linear-gradient(135deg, #FF2E63 0%, #8B5CF6 100%); padding: 3px; border-radius: 12px; display: inline-block;">
                          <div style="background: #0a0a0f; padding: 20px 50px; border-radius: 10px;">
                            <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace;">
                              ${otp}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0 0; color: #FF2E63; font-size: 14px; text-align: center;">
                    ⏱️ This code expires in <strong>5 minutes</strong>
                  </p>
                </td>
              </tr>
            </table>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #12121a; padding: 20px; border-radius: 0 0 16px 16px;">
              <tr>
                <td align="center">
                  <p style="margin: 0; color: #606060; font-size: 12px;">
                    Never share this code. If you didn't request this, ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject: '🔐 Your TradeX Floor Academy Login Code', html });
};

const escapeHtml = (str) => {
  if (!str) return str;
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

export const sendAdminOtpEmail = async (email, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
          <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0; padding: 30px;">
              <tr>
                <td align="center">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    <span style="color: #FF2E63;">TradeX</span><span style="color: #08D9D6;">Floor</span>
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #a0a0a0; font-size: 14px;">Admin Portal</p>
                </td>
              </tr>
            </table>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #1a1a2e; padding: 40px 30px;">
              <tr>
                <td>
                  <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px; font-weight: 600; text-align: center;">
                    🛡️ Admin Access Verification
                  </h2>
                  <p style="margin: 0 0 30px 0; color: #b0b0b0; font-size: 16px; line-height: 1.6; text-align: center;">
                    Enter this code to access the admin panel:
                  </p>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <div style="background: linear-gradient(135deg, #FF2E63 0%, #8B5CF6 100%); padding: 3px; border-radius: 12px; display: inline-block;">
                          <div style="background: #0a0a0f; padding: 20px 50px; border-radius: 10px;">
                            <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace;">
                              ${otp}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0 0; color: #FF2E63; font-size: 14px; text-align: center;">
                    ⏱️ Expires in 5 minutes
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject: '🛡️ TradeX Floor Admin Verification Code', html });
};

export const sendPurchaseReceipt = async (email, userName, productTitle, amount) => {
  const safeUserName = escapeHtml(userName) || 'Valued Customer';
  const safeProductTitle = escapeHtml(productTitle);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
          <td>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0; padding: 30px;">
              <tr>
                <td align="center">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    <span style="color: #FF2E63;">TradeX</span><span style="color: #08D9D6;">Floor</span>
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #a0a0a0; font-size: 14px;">Academy</p>
                </td>
              </tr>
            </table>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #1a1a2e; padding: 40px 30px;">
              <tr>
                <td>
                  <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px; font-weight: 600; text-align: center;">
                    🎉 Purchase Confirmed!
                  </h2>
                  <p style="margin: 0 0 20px 0; color: #b0b0b0; font-size: 16px; line-height: 1.6; text-align: center;">
                    Hi ${safeUserName}, thank you for your purchase!
                  </p>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #12121a; border-radius: 12px; padding: 20px;">
                    <tr>
                      <td>
                        <p style="margin: 0 0 10px 0; color: #a0a0a0; font-size: 14px;">Product</p>
                        <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 18px; font-weight: 600;">${safeProductTitle}</p>
                        <p style="margin: 0 0 10px 0; color: #a0a0a0; font-size: 14px;">Amount Paid</p>
                        <p style="margin: 0; color: #08D9D6; font-size: 24px; font-weight: 700;">₹${amount}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                    <tr>
                      <td align="center">
                        <a href="${process.env.NEXTAUTH_URL || 'https://tradexfloor.com'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #FF2E63 0%, #8B5CF6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                          Go to Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #12121a; padding: 20px; border-radius: 0 0 16px 16px;">
              <tr>
                <td align="center">
                  <p style="margin: 0; color: #606060; font-size: 12px;">
                    Thank you for choosing TradeX Floor Academy. Happy learning!
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject: `🎉 Purchase Confirmed: ${productTitle}`, html });
};
