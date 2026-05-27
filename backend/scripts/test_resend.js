import 'dotenv/config';
import { Resend } from 'resend';

// Get target email from CLI arguments, e.g.: node scripts/test_resend.js your-email@gmail.com
const targetEmail = process.argv[2];

async function runTest() {
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  console.log('📬 --- Resend Email Verification Test ---');
  console.log(`🔑 API Key Found: ${apiKey ? 'Yes (starts with ' + apiKey.substring(0, 7) + '...)' : 'No'}`);
  console.log(`✉️  Sender Email (EMAIL_FROM): ${emailFrom}`);

  if (!apiKey) {
    console.error('❌ Error: RESEND_API_KEY is not defined in your backend/.env file!');
    process.exit(1);
  }

  if (!targetEmail) {
    console.warn('\n⚠️  No recipient email specified.');
    console.warn('👉 Usage: node scripts/test_resend.js <your_email@example.com>');
    console.warn('💡 Note: If using a free/unverified Resend account, the recipient email MUST be the email address you registered your Resend account with.');
    process.exit(1);
  }

  console.log(`🎯 Recipient Email: ${targetEmail}`);
  console.log('Sending test email... Please wait...');

  try {
    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from: emailFrom,
      to: targetEmail,
      subject: 'HampiStays – Resend API Key Test Connection',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px;">
          <h2 style="color: #4F46E5;">Resend Integration Test</h2>
          <p>Hello,</p>
          <p>If you are reading this, your Resend API integration is working perfectly in your HampiStays backend!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777;">Sent on: ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    if (response.error) {
      console.error('\n❌ Resend API returned an error:');
      console.error(JSON.stringify(response.error, null, 2));
      
      if (response.error.message && response.error.message.includes('restricted')) {
        console.log('\n💡 Tip: Since you are using the default "onboarding@resend.dev" sender, you can only send emails to the email address registered with your Resend account. To send to anyone, you must verify your custom domain in the Resend Dashboard.');
      }
    } else {
      console.log('\n✅ Success! Test email sent successfully.');
      console.log('Response details:', response.data);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error running test:', error);
  }
}

runTest();
