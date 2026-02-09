import sgMail from '@sendgrid/mail';

const sendEmail = async (options) => {
    // Validate API key exists
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
        console.error('❌ SENDGRID_API_KEY is not set in environment variables!');
        throw new Error('Email service not configured. Please contact support.');
    }

    // Set API key
    sgMail.setApiKey(apiKey);

    const fromEmail = process.env.FROM_EMAIL || "derrickemma44@gmail.com";

    console.log('📧 Attempting to send email via SendGrid...');
    console.log('   To:', options.email);
    console.log('   Subject:', options.subject);
    console.log('   From:', fromEmail);
    console.log('   API Key present:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'No');

    const msg = {
        to: options.email,
        from: {
            email: fromEmail,
            name: 'ExamRedi'
        },
        subject: options.subject,
        html: options.html || options.message,
        text: options.message || options.html?.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    try {
        const response = await sgMail.send(msg);
        console.log('✅ Email sent successfully via SendGrid!');
        console.log('   Status Code:', response[0].statusCode);
        console.log('   Message ID:', response[0].headers['x-message-id']);
        return response;
    } catch (error) {
        console.error('❌ Error sending email with SendGrid:');
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        if (error.response) {
            console.error('   Response body:', JSON.stringify(error.response.body, null, 2));
        }
        throw error;
    }
};

export default sendEmail;
