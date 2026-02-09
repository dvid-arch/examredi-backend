import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Validate Gmail credentials
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
        console.error('❌ Gmail credentials not set in environment variables!');
        console.error('   Missing:', !gmailUser ? 'GMAIL_USER' : 'GMAIL_APP_PASSWORD');
        throw new Error('Email service not configured. Please contact support.');
    }

    console.log('📧 Attempting to send email via Gmail (Nodemailer)...');
    console.log('   To:', options.email);
    console.log('   Subject:', options.subject);
    console.log('   From:', gmailUser);

    // Create transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailUser,
            pass: gmailAppPassword
        }
    });

    const mailOptions = {
        from: {
            name: 'ExamRedi',
            address: gmailUser
        },
        to: options.email,
        subject: options.subject,
        html: options.html || options.message,
        text: options.message || options.html?.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully via Gmail!');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);
        return info;
    } catch (error) {
        console.error('❌ Error sending email with Gmail:');
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Full error:', error);
        throw error;
    }
};

export default sendEmail;
