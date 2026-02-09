import * as brevo from '@getbrevo/brevo';

const sendEmail = async (options) => {
    const apiInstance = new brevo.TransactionalEmailsApi();

    // Set API key from environment variable
    const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;

    // Validate API key exists
    if (!apiKey) {
        console.error('❌ BREVO_API_KEY is not set in environment variables!');
        throw new Error('Email service not configured. Please contact support.');
    }

    console.log('📧 Attempting to send email via Brevo...');
    console.log('   To:', options.email);
    console.log('   Subject:', options.subject);
    console.log('   From:', process.env.FROM_EMAIL || "support@examredi.com");
    console.log('   API Key present:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'No');

    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html || options.message;
    sendSmtpEmail.sender = {
        name: "ExamRedi",
        email: process.env.FROM_EMAIL || "support@examredi.com"
    };
    sendSmtpEmail.to = [{ email: options.email }];

    // Optional: Add plain text version if needed
    if (options.message) {
        sendSmtpEmail.textContent = options.message;
    }

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Email sent successfully via Brevo!');
        console.log('   Message ID:', data.messageId);
        return data;
    } catch (error) {
        console.error('❌ Error sending email with Brevo:');
        console.error('   Error details:', error.response ? JSON.stringify(error.response.body, null, 2) : error.message);
        console.error('   Full error:', error);
        throw error;
    }
};

export default sendEmail;
