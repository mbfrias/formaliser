// ---------------------------------------------------------
// net.formaliser.server
// 
// free-to-use webform backend for websites and apps
// ---------------------------------------------------------

function validateForm(name, email, subject, message) {
    if (name == "" || email == "" || subject == "" || message == "") {
        return [false, "Please fill all fields."]
    }
    if (name == null || email == null || subject == null || message == null) {
        return [false, "Please fill all fields."]
    }
    if (name == undefined || email == undefined || subject == undefined || message == undefined) {
        return [false, "Please fill all fields."]
    }
    if (!email.includes("@")) {
        return [false, "Please enter a valid email address."]
    } else {
        return [true, "Form validated."]
    };
};



const express = require('express');
const rateLimit = require("express-rate-limit");
const http = require('http');
const https = require('https');
const app = express();
const dotenv = require('dotenv').config();
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const fs = require('fs');
if (process.env.HOSTMASTER == "localhost") {
    var http_options = {
        key: fs.readFileSync('./certs/banksymac.local+7-key.pem'),
        cert: fs.readFileSync('./certs/banksymac.local+7.pem')
    };
    var redirPort = 80;
    var port = 443;
} else if (process.env.HOSTMASTER == "digitalocean") {
    var port = 80;
} else if (process.env.HOSTMASTER == null || process.env.HOSTMASTER == undefined) {
    console.log("HOSTMASTER is not defined in environment variables.");
    process.exit(1);
};

const limiter = rateLimit({
    windowMs: 5 * 60 * 60 * 1000,
    max: 2,
    handler: function (req, res) {
        res.status(429).send("You've sent too many requests. Please try again later.");
    }
});

app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/index.html');
});

app.post('/send', limiter, (req, res) => {
    const params = req.query;

    let isValid = validateForm(req.body.name, req.body.email, req.body.subject, req.body.message);
    if (!isValid[0]) {
        res.status(400).send(isValid[1]);
        return;
    }

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
    for (let key in req.body) {
        if (key != "name" && key != "email" && key != "subject" && key != "message") {
            fields += `<li>${key}: ${req.body[key]}</li>`;
        }
    }

    var mailOptions = {
        from: `FORMALISER.NET Form <noreply.submission@formaliser.net>`,
        to: `${params.to}`,
        subject: `Message from ${req.body.name}: ${req.body.subject}`,
        replyTo: `${req.body.email}`,
        html: `
        <!DOCTYPE html>
        <head>
            <meta charset="utf-8" http-equiv="Content-Type" content="text/html">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Form submission powered by FORMALISER.NET</title>
            <link rel="stylesheet" href="https://formaliser.net/mailerconfig/content/styles.css">
        </head>
        <body>
            <header class="header">
                <a href="https://formaliser.net"><img src="https://formaliser.net/formaliser.svg" alt="FORMALISER.NET"></a>
                <h1>Webform submission</h1>
            </header>
            <div class="content">
                <h3>You've received a message on your webform from <span id="senderemail">${req.body.name}</span></h3>
                <p>Here's the message:</p>
                <hr>
                <h4 class="sender">From ${req.body.name} (${req.body.email})</h4>
                <h4 class="subject">${req.body.subject}</h4>
                <p class="message">${req.body.message}</p>
                <p>Want to reply? Just hit reply in your email client. The sender's email address will be automatically filled in.</p>
                <hr>
                <h6>Other fields not automatically parsed by FORMALISER.NET:</h6>
                <ul>
                    ${fields}
                </ul>
                <hr>
                <p class="footer">Powered by <a href="https://formaliser.net">FORMALISER.NET</a></p>
        </body>
        `
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

if (process.env.HOSTMASTER == "localhost") {
    http.createServer(app).listen(redirPort, () => {
        console.log(`Listening on port ${redirPort}`);
    });
    https.createServer(http_options, app).listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
} else if (process.env.HOSTMASTER == "digitalocean") {
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
} else if (process.env.HOSTMASTER == null || process.env.HOSTMASTER == undefined) {
    console.log("HOSTMASTER is not defined in environment variables.");
    process.exit(1);
}