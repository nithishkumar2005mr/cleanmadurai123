import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter && process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }
  return transporter;
}

export async function sendReportEmail(to: string, subject: string, reportData: any) {
  const mailTransporter = getTransporter();
  
  if (!mailTransporter) {
    console.warn('Gmail credentials (GMAIL_USER, GMAIL_PASS) not configured. Skipping email.');
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #10b981;">Madurai Clean 3.0 - Report Copy</h2>
      <p>A new civic issue has been reported. Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Category:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${reportData.category}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Urgency:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${reportData.urgency.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Ward:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${reportData.ward_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Description:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${reportData.description}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Location:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${reportData.lat}, ${reportData.lng}</td>
        </tr>
      </table>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">
        This is an automated message from Madurai Clean 3.0. Please do not reply to this email.
      </p>
    </div>
  `;

  try {
    await mailTransporter.sendMail({
      from: `"Madurai Clean 3.0" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error: any) {
    if (error.responseCode === 534 && error.response && error.response.includes('Application-specific password required')) {
      console.error(`Failed to send email to ${to}: Gmail requires an App Password. Please generate an App Password in your Google Account settings and set it as GMAIL_PASS in your environment variables.`);
    } else {
      console.error(`Failed to send email to ${to}:`, error.message || error);
    }
  }
}
