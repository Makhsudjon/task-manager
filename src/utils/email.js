import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port:993,
    secure:true,
    auth:{
        user: 't.makhsudjon@gmail.com',
        pass: 'glzcbelneveeifjy'
    }
});

async function sendMessage(data) {
    try {
        const mailOptions = {
            from:'t.makhsudjon@gmail.com',
            to:data.to,
            subject:data.subject,
            text:data.text
        }
        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (e) {
        throw new Error(e.message);
    }
}

export default sendMessage

