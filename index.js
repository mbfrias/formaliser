// ---------------------------------------------------------
// net.formaliser.server
// 
// free-to-use webform backend for websites and apps
// ---------------------------------------------------------

function validateForm(name, email, subject, message) {
    if (name == "" || email == "" || subject == "" || message == "") {
        return [false, __dirname + '/static/mailerconfig/handlerpages/empty.html'];
    }
    if (name == null || email == null || subject == null || message == null) {
        return [false, __dirname + '/static/mailerconfig/handlerpages/empty.html'];
    }
    if (name == undefined || email == undefined || subject == undefined || message == undefined) {
        return [false, __dirname + '/static/mailerconfig/handlerpages/empty.html'];
    }
    if (!email.includes("@")) {
        return [false,  __dirname + '/static/mailerconfig/handlerpages/noemail.html'];
    } else {
        return [true, ""];
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
    var port = 8080;
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