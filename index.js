// ---------------------------------------------------------
// com.marrtin.freewebforms
// 
// free-to-use webform backend for websites and apps
// ---------------------------------------------------------

const express = require('express');
const http = require('http');
const https = require('https');
const app = express();
const dotenv = require('dotenv').config();
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
if (process.env.HOSTMASTER == "localhost") {
    var http_options = {
        key: fs.readFileSync('./certs/banksymac.local+7-key.pem'),
        cert: fs.readFileSync('./certs/banksymac.local+7.pem')
    };
    const redirPort = 80;
    const port = 443;
} else if (process.env.HOSTMASTER == "digitalocean") {
    const port = 80;
} else if (process.env.HOSTMASTER == null || process.env.HOSTMASTER == undefined) {
    console.log("HOSTMASTER is not defined in environment variables.");
    process.exit(1);
};

app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/index.html');
});

app.post('/send', (req, res) => {
    const params = req.query;
    var transporter = nodemailer.createTransport({
        host: "mail.spacemail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAILER_USERNAME,
            pass: process.env.MAILER_PASSWORD
        }
    });

    let fields = "";
    for (let key in params) {
        fields += `<li>${key}: ${params[key]}</li>`
    }

    var mailOptions = {
        from: `YourForm <${process.env.MAILER_USERNAME}>`,
        to: `${params.to}`,
        subject: `From ${params.name}: ${params.subject}`,
        html: `
        <p>${params.message}</p>
        <ul>
            ${fields}
        </ul>`
    }
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error sending email.");
        } else {
            console.log(info);
            res.status(200).send("Email sent successfully.");
        }
    });
});