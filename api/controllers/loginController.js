'use strict';

var successCode = "200";
var errorCode = "204";

var db = require('../models/model'); //database model loaded here
var allQuery = require('../models/queryList');
var sql = allQuery["driverQueries"];
var sqlUser = allQuery["userQueries"];
var sqlFleetManager = allQuery["fleetManagerQueries"];
var helperFunctions = require('../utilities/helperFunctions');

//logger
var util = require('util');


/**
 * Login user by mobile number
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.login_by_number = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.mobile) {
        errors.push("No mobile number specified");
    }
    if (!req.body.pin) {
        errors.push("No PIN specified");
    }
    // if ((req.body.pin).length > 4) {
    //     errors.push("No PIN specified");
    // }

    // check if PIN contains only digits
    let isnum = /^\d+$/.test(req.body.pin);

    if (isnum == false) {
        errors.push("Only numbers are allowed for PIN");
    }

    // if (isnum == true && isnum.toString().length >= 5) {
    //     errors.push("PIN should not be more than 4");
    // }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        mobile: req.body.mobile,
        pin: helperFunctions.cryptoEncrypt(req.body.pin)
    }

    // lets check if the number exists
    var params = [data.mobile]
    db.query(sql.driverByPhoneNumber, params, function (err, driverData) {

        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (driverData.length == 0) {

            //since it is not a driver then lets check if it is a fleet manager
            var params = [data.mobile]
            db.query(sqlFleetManager.fleetManagerByPhoneNumber, params, function (err, fleetManagerData) {

                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (fleetManagerData.length == 0) {

                    res.json({
                        "code": errorCode,
                        "message": "Unable to find user with mobile number" + " " + data.mobile + ". Kindly see admin."
                    })
                    return;
                }

                else {
                    //create the fleet manager user

                    // lets get the driver ID here
                    var userId = fleetManagerData[0]["user_id"];

                    var otp = helperFunctions.otpGenerate();

                    var params = [data.mobile]
                    db.query(sql.checkLoggedInDriver, params, function (err, loginData) {
                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        }

                        // since driver is not registered lets register the driver
                        if (loginData.length == 0) {

                            var params = [userId, otp, data.pin, data.mobile, "no_push_id_yet"]


                            db.query(sql.registerDriver, params, function (err, result) {

                                if (err) {
                                    res.status(400).json({ "error": err.message })
                                    return;
                                } else {
                                    // we need to send the OTP here to the driver by SMS
                                    res.json({
                                        "code": successCode,
                                        "message": "Fleet Manager was successfully registered",
                                        "otp": otp,
                                        "userType": "fleetManager",
                                        "data": fleetManagerData
                                    })
                                    return;
                                }

                            });


                        }

                        // Fleet manager is already registered and details are correct
                        else {

                            // lets check if the PIN entered is the same as that in the db

                            var dbPin = loginData[0]["password"]

                            if (data.pin.toUpperCase().toString() == dbPin.toUpperCase().toString()) {
                                res.json({
                                    "code": successCode,
                                    "message": "Login Successful",
                                    "userType": "fleetManager",
                                    "data": fleetManagerData
                                })
                                console.log(util.inspect(fleetManagerData));
                                return;
                            } else {
                                res.json({
                                    "code": errorCode,
                                    "message": "PIN is incorrect, try again"
                                })
                                console.log(util.inspect(fleetManagerData));
                                return;
                            }

                        }

                    });
                }

            });
        }
        // since the exists lets proceed to check if the driver is registered on the APP
        else {

            // lets get the driver ID here
            var driverId = driverData[0]["driver_id"];

            var otp = helperFunctions.otpGenerate();

            var params = [data.mobile]
            db.query(sql.checkLoggedInDriver, params, function (err, loginData) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                // since driver is not registered lets register the driver
                if (loginData.length == 0) {

                    var params = [driverId, otp, data.pin, data.mobile, "no_push_id_yet"]


                    db.query(sql.registerDriver, params, function (err, result) {

                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        } else {
                            // we need to send the OTP here to the driver by SMS
                            res.json({
                                "code": successCode,
                                "message": "Driver was successfully registered",
                                "otp": otp,
                                "userType": "driver",
                                "data": driverData
                            })
                            return;
                        }

                    });


                }

                // driver is already registered and details are correct
                else {

                    // lets check if the PIN entered is the same as that in the db

                    var dbPin = loginData[0]["password"]

                    if (data.pin.toUpperCase().toString() == dbPin.toUpperCase().toString()) {
                        res.json({
                            "code": successCode,
                            "message": "Login Successful",
                            "userType": "driver",
                            "data": driverData
                        })
                        console.log(util.inspect(driverData));
                        return;
                    } else {
                        res.json({
                            "code": errorCode,
                            "message": "PIN is incorrect, try again"
                        })
                        console.log(util.inspect(driverData));
                        return;
                    }

                }

            });
        }
    });
}


/**
 * Reset PIN by number
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.reset_pin_by_number = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.mobile) {
        errors.push("No mobile number specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        mobile: req.body.mobile
    }

    // lets check if the number exists
    var params = [data.mobile]
    db.query(sql.checkLoggedInDriver, params, function (err, driverData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (driverData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find user with mobile number" + " " + data.mobile + ". Kindly register"
            })
            return;
        }
        // since the exists lets proceed to check if the driver is registered on the APP
        else {
            var otp = helperFunctions.otpGenerate();

            // update the OTP in the DB
            var params = [otp, data.mobile]
            db.query(sql.updateOtp, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {
                    var apiCall = helperFunctions.SMSAPI(data.mobile, otp);
                    if (apiCall == false) {
                        res.json({
                            "code": errorCode,
                            "message": "An error occured sending the OTP via SMS"
                        });
                        return;
                    }
                    else {
                        res.json({
                            "code": successCode,
                            "message": "OTP Sent successfully via SMS",
                            // "otp": otp,
                            "data": driverData
                        });
                        return;
                    }
                }
            });
        }
    });
}


/**
 * Reset PIN by checking OTP
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.check_user_otp = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.mobile) {
        errors.push("No mobile number specified");
    }

    if (!req.body.otp) {
        errors.push("No otp specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        mobile: req.body.mobile,
        otp: req.body.otp
    }

    // lets check if the driver is registered on the APP
    var params = [data.mobile]
    db.query(sql.checkLoggedInDriver, params, function (err, driverData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (driverData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find user with mobile number" + " " + data.mobile + ". Kindly register"
            })
            return;
        } else {
            // now lets compare the OTP
            var dbOtp = driverData[0]["otp"]
            if (data.otp.toString() == dbOtp.toString()) {
                res.json({
                    "code": successCode,
                    "message": "OTP confirmed Successfully",
                    "data": driverData
                })
                return;
            } else {
                res.json({
                    "code": errorCode,
                    "message": "OTP is incorrect, try again"
                })
                return;
            }
        }
    });
}


/**
 * Reset PIN by reseting PIN
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.accept_pin = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.mobile) {
        errors.push("No mobile number specified");
    }
    if (!req.body.pin) {
        errors.push("No PIN specified");
    }
    // if ((req.body.pin).length > 4) {
    //     errors.push("No PIN specified");
    // }

    // check if PIN contains only digits
    let isnum = /^\d+$/.test(req.body.pin);

    if (isnum == false) {
        errors.push("Only numbers are allowed for PIN");
    }

    // if (isnum == true && isnum.toString().length >= 5) {
    //     errors.push("PIN should not be more than 4");
    // }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var encryptedPin = helperFunctions.cryptoEncrypt(req.body.pin.toString());

    var data = {
        mobile: req.body.mobile,
        pin: encryptedPin
    }

    // lets check if the driver is registered on the APP
    var params = [data.mobile]
    db.query(sql.checkLoggedInDriver, params, function (err, driverData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (driverData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find user with mobile number" + " " + data.mobile + ". Kindly register"
            })
            return;
        } else {

            // update the new PIN in the DB
            var params = [data.pin, data.mobile]
            db.query(sql.updatePin, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {
                    res.json({
                        "code": successCode,
                        "message": "PIN reset was successful",
                        "data": driverData
                    })

                    return;
                }
            });

        }
    });
}

/**
 * save player ID into the DB for PUSH Notifications
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.update_push_notification_id = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.deviceNotificationId) {
        errors.push("No device notification ID specified");
    }
    if (!req.body.mobileNumber) {
        errors.push("No mobile number specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        deviceNotificationId: req.body.deviceNotificationId,
        mobileNumber: req.body.mobileNumber
    }

    // save device notification user ID into the DB
    var params = [data.mobileNumber]
    db.query(sqlUser.checkLoggedInUser, params, function (err, userData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find user with mobile number" + " " + data.mobile + ". Kindly register"
            })
            return;
        } else {

            // update the push notification ID in the DB
            var params = [data.deviceNotificationId, data.mobileNumber]
            db.query(sqlUser.updatePushNotificationId, params, function (err, pushNotificationData) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {
                    res.json({
                        "code": successCode,
                        "message": "Device push notification ID saved successfully",
                        "data": userData
                    })

                    return;
                }
            });

        }
    });
}