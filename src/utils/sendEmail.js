import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    console.log('Initializing email transporter...');

    // Port 587 (STARTTLS) is often more compatible with cloud provider networks
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS?.replace(/\s/g, ''), // Ensure no spaces
        },
        // Wait at most 15 seconds for connection
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
    });

    const mailOptions = {
        from: `"ExamRedi Support" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    try {
        console.log(`Attempting to send email to: ${options.email}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully! Message ID:', info.messageId);
        return info;
    } catch (error) {
        console.error('Nodemailer Error:', error.message);
        if (error.code === 'EAUTH') {
            console.error('Authentication failed. Please check your EMAIL_USER and EMAIL_PASS (App Password).');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('Connection timed out. Render might be blocking the SMTP port or Gmail is not responding.');
        }
        throw error;
    }
};

export default sendEmail;
