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

    // Create transporter with timeout settings
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailUser,
            pass: gmailAppPassword
        },
        // Add timeout and connection settings
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000,
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 100
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
        console.log('   Connecting to Gmail SMTP...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully via Gmail!');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);

        // Close the transporter
        transporter.close();

        return info;
    } catch (error) {
        console.error('❌ Error sending email with Gmail:');
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);

        // Provide helpful error messages
        if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
            console.error('   → Connection timeout. Check if GMAIL_APP_PASSWORD is set correctly.');
        } else if (error.code === 'EAUTH') {
            console.error('   → Authentication failed. Verify GMAIL_USER and GMAIL_APP_PASSWORD.');
        }

        console.error('   Full error:', error);

        // Close the transporter on error
        transporter.close();

        throw error;
    }
};

export default sendEmail;
