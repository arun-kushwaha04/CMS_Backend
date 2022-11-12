const nodemailer = require("nodemailer");
const oAuth2Client = require("./googleapis");

const createTransporter = async () => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        return await nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL,
                accessToken: accessToken,
                clientId: process.env.OAUTH_CLIENT_ID,
                clientSecret: process.env.OAUTH_CLIENT_SECRET,
                refreshToken: process.env.OAUTH_REFRESH_TOKEN,
            },
        });
    } catch (e) {
        console.log(e)
        throw e;
    }
};

module.exports.sendEmail = async (emailOptions) => {
    try {
        let transporter = await createTransporter();
        await transporter.sendMail(emailOptions);
    } catch (e) {
        throw e;
    }
};
