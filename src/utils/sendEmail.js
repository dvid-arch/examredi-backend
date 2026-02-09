import * as brevo from '@getbrevo/brevo';

const sendEmail = async (options) => {
    const apiInstance = new brevo.TransactionalEmailsApi();

    // Set API key from environment variable
    const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
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
        console.log('Email sent successfully via Brevo:', data);
        return data;
    } catch (error) {
        console.error('Error sending email with Brevo:', error.response ? error.response.body : error);
        throw error;
    }
};

export default sendEmail;
