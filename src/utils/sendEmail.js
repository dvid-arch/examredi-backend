import { Resend } from 'resend';

const sendEmail = async (options) => {
    // Use environment variable only
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const data = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'onboarding@resend.dev', // Use separate env or default Resend sender
            to: options.email,
            subject: options.subject,
            html: options.html || options.message, // Ensure HTML content is used if available
            text: options.message
        });

        console.log('Email sent successfully:', data);
        return data;
    } catch (error) {
        console.error('Error sending email with Resend:', error);
        throw error;
    }
};

export default sendEmail;
