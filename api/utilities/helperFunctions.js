/** UTILITIES FUNCTIONS STARTS HERE **/
var atob = require('atob');
var btoa = require('btoa');
var cryptoPassword = "petro$m@rt";

// Includes crypto module 
const crypto = require('crypto');

// Defining algorithm 
const algorithm = 'aes-128-cbc';

let secret = "Petrosmart@1"


let helperFunctions = {

    cryptoEncrypt(text) {
        var mykey = crypto.createCipher(algorithm, secret);
        var mystr = mykey.update(text, 'utf8', 'hex')
        mystr += mykey.final('hex');

        return mystr;
    },

    cryptoDecrypt(text) {
        var mykey = crypto.createDecipher(algorithm, secret);
        var mystr = mykey.update(text, 'hex', 'utf8')
        mystr += mykey.final('utf8');
        
        return mystr;
    },

    randomString() {
        var length = 20;
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    },

    userIdString() {
        var length = 15;
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    },

    otpGenerate() {
        var length = 6;
        var chars = '0123456789';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    },

    referenceGenerate() {
        var length = 10;
        var chars = '0123456789';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    },

    generateInvoiceNumber() {
        var invNo = "P2/E/" + "" + Math.floor((Math.random() * 10000) + 1)
        return invNo;
    },

    //TO SENTENCE CASE
    toTitleCase(str) {
        if (str == "" || str == undefined) {
            return str
        } else {
            return str.replace(
                /\w\S*/g,
                function (txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            );
        }
    },

    //RETURN BOOLEAN VALUES
    getBoolean(value) {
        switch (value) {
            case true:
            case "true":
            case 1:
            case "1":
            case "on":
            case "yes":
                return true;
            default:
                return false;
        }
    },

    // thousand seperators
    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    //round to 2 decimal place
    roundToTwo(num) {
        return +(Math.round(num + "e+2") + "e-2");
    },

    utoa(str) {
        return btoa(unescape(encodeURIComponent(str)));
    },

    atou(str) {
        return decodeURIComponent(escape(atob(str)));
    },

    SMSAPI(mobileNumber, otp) {

        //here we are suppose to send the OTP to the driver by SMS
        //sending OTP VIA SMS to DRIVER 
        var request = require('request');
        var username = "jpq1jjsq";
        var password = "eTDhow2R";
        var sender = "Petrosmart";
        var userNumber = mobileNumber;
        var smsMessage = otp + " is your Petrosmart OTP Code";
        var options = {
            'method': 'GET',
            'url': 'https://api.smsglobal.com/http-api.php?action=sendsms&user=' + username + '&password=' + password + '&from=' + sender + '&to=' + userNumber + '&text=' + smsMessage,
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) {
                console.log("error occured while sending OTP --->", error)
                // throw new Error(error);
                return false;
            }
            console.log("SMS API--->>OTP HTTP Response --> ", response.body);
            var responseBody = response.body;

            if (responseBody.toString().includes("OK: 0; Sent")) {
                return true;
            } else {
                return false;
            }

        });

    },

    PUSHNOTIFICATIONAPI(subscriberNotificationIds, messageTitle, messageBody, userNotificationType) {
        //note that subscriberNotificationIds is an ARRAY
        let endpoint = "https://onesignal.com/api/v1/notifications"

        var request = require('request');
        var options = {
            'method': 'POST',
            'url': endpoint,
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ZTM5NDBkMTUtZmVlYy00NDEyLThlZmQtNmUzMzM3ZGMxZDBj'
            },
            body: JSON.stringify({
                app_id: "92eddf81-35b0-462c-ae88-e813338f18a3",
                include_player_ids: subscriberNotificationIds,
                headings: { en: messageTitle },
                contents: { en: messageBody },
                data: { "custom_data": userNotificationType }
            })
        };

        console.log("push notification options are-->>", options);

        request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log("PUSH API Response is --->>>>", response.body);
        });
    },

    // //MOMO API OPTIONS
    MOMOAPIOPTIONS(authorization, merchantToken, amount, description, reference, mobile, operator, callbackUrl) {

        var options = {
            'method': 'POST',
            'url': 'https://test.wiztransact.com/v1.0/TRANSFER',
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': authorization.toString()
            },
            body: JSON.stringify({
                "merchantToken": merchantToken.toString(),
                "amount": parseInt(amount),
                "desc": description,
                "ref": reference,
                "mobile": mobile,
                "operator": operator,
                "callbackUrl": callbackUrl
            })

        };

        return options;
    }

}

module.exports = helperFunctions;