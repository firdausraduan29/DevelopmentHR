// Resend email integration for leave notifications
import { Resend } from 'resend';

interface LeaveNotificationParams {
  toEmail: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'hr_approved' | 'approved' | 'rejected';
  comment?: string;
  approverRole: 'HR' | 'Director';
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) throw new Error("RESEND_API_KEY is missing");
  if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is missing");

  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

// ✅ New email: notify Director when employee submits leave (NOT approval email)
export async function sendNewLeaveRequestAlertToDirector(params: {
  toEmail: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
}): Promise<boolean> {
  try {
    const { client, fromEmail } = getResendClient();

    const subject = `New Leave Application Submitted - ${params.leaveType} Leave`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">HR System</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Leave Management System</p>
        </div>

        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0;">New Leave Application Submitted</h2>

          <p>Hi Director,</p>
          <p>A new leave request has been submitted and requires your review.</p>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Employee:</td>
                <td style="padding: 6px 0; font-weight: 600;">${params.employeeName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Leave Type:</td>
                <td style="padding: 6px 0; font-weight: 600; text-transform: capitalize;">${params.leaveType}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Dates:</td>
                <td style="padding: 6px 0; font-weight: 600;">${params.startDate} - ${params.endDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Total Days:</td>
                <td style="padding: 6px 0; font-weight: 600;">${params.totalDays} days</td>
              </tr>
            </table>
          </div>

          <p style="color: #6b7280; font-size: 13px;">
            Please log in to the system to approve or reject this request.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 22px 0;">

          <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
            This is an automated message. Please do not reply.
          </p>
        </div>
      </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: params.toEmail,
      subject,
      html,
    });

    console.log(`Director alert email sent to ${params.toEmail} for new leave request`);
    return true;
  } catch (error) {
    console.error("Failed to send director alert email:", error);
    return false;
  }
}

export async function sendLeaveNotification(params: LeaveNotificationParams): Promise<boolean> {
  try {
    const { client, fromEmail } = getResendClient();
    
    const statusLabel = params.status === 'approved' 
      ? 'Approved' 
      : params.status === 'hr_approved' 
        ? 'HR Approved (Awaiting Director)' 
        : 'Rejected';
    
    const statusColor = params.status === 'rejected' ? '#dc2626' : '#16a34a';
    
    const subject = `Leave Request ${statusLabel} - ${params.leaveType} Leave`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">HR System</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Leave Management System</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0;">Leave Request Update</h2>
          
          <p>Dear ${params.employeeName},</p>
          
          <p>Your leave request has been reviewed by ${params.approverRole}.</p>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Leave Type:</td>
                <td style="padding: 8px 0; font-weight: 600; text-transform: capitalize;">${params.leaveType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Duration:</td>
                <td style="padding: 8px 0; font-weight: 600;">${params.startDate} - ${params.endDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Total Days:</td>
                <td style="padding: 8px 0; font-weight: 600;">${params.totalDays} day(s)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Status:</td>
                <td style="padding: 8px 0;">
                  <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;">
                    ${statusLabel}
                  </span>
                </td>
              </tr>
              ${params.comment ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Comment:</td>
                <td style="padding: 8px 0;">${params.comment}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          ${params.status === 'hr_approved' ? `
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Note:</strong> Your request has been approved by HR and is now awaiting final approval from the Director.
          </p>
          ` : ''}
          
          ${params.status === 'approved' ? `
          <p style="color: #16a34a;">
            Your leave has been fully approved. Your leave balance has been updated accordingly.
          </p>
          ` : ''}
          
          ${params.status === 'rejected' ? `
          <p style="color: #dc2626;">
            Unfortunately, your leave request has been rejected. Please contact ${params.approverRole} for more information.
          </p>
          ` : ''}
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
            This is an automated message from DevelopmentHR. Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: params.toEmail,
      subject,
      html
    });

    console.log(`Email notification sent to ${params.toEmail} for ${params.status} status`);
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}
