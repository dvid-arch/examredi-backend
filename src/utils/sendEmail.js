import nodemailer from 'nodemailer';

// Create the transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS?.replace(/\s/g, '') // Ensure no spaces
    }
});

// Reusable function to send email
// Supporting both {to} and {email} for backward compatibility
const sendEmail = async ({ to, email, subject, text, html }) => {
    console.log('sendEmail() called');
    const recipient = to || email;

    try {
        const info = await transporter.sendMail({
            from: `"ExamRedi Support" <${process.env.EMAIL_USER}>`,
            to: recipient,
            subject,
            text,
            html
        });

        console.log('Email sent:', info.response);
        return { success: true, info };
    } catch (error) {
        console.error('Email send failed:', error);
        return { success: false, error };
    }
};

export default sendEmail;
