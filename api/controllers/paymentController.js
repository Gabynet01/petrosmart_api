'use strict';

var successCode = "200";
var warningCode = "201";
var errorCode = "204";

var db = require('../models/model'); //database model loaded here
var allQuery = require('../models/queryList');

var helperFunctions = require('../utilities/helperFunctions');

var sql = allQuery["driverQueries"];
var sqlUser = allQuery["userQueries"];
var sqlStation = allQuery["stationQueries"];
var sqlPayment = allQuery["paymentQueries"];

var request = require('request');
//some global declarations for the payment channel
var callBackurl = "http://test.petrosmartgh.com:7171/api_momo_callback";

/**
 * Generate Payment Code
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.generate_code = function (req, res) {
    // create an array of errors to return
    var errors = []
    // var paymentType = req.body.paymentType;
    // if (!paymentType) {
    //     errors.push("No payment type specified");
    // }
    // if (paymentType.toUpperCase() != "POS" && paymentType.toUpperCase() != "VOUCHER") {
    //     errors.push("Only POS or VOUCHER allowed as payment types");
    // }
    if (!req.body.transactionId) {
        errors.push("No transaction ID specified");
    }
    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        // paymentType: paymentType,
        transactionId: req.body.transactionId
    };

    // lets add the rest of the data here
    var paymentCode = helperFunctions.randomString();
    var paymentCodeStatus = "ACTIVE";


    // first lets verify if the transaction ID is valid 
    var params = [data.transactionId]
    db.query(sqlPayment.checkTransactionId, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (result.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Transaction ID does not exist or code has already been generated or used"
            })
            return;
        } else {

            // Lets update the database with details
            var params = ["AUTO-TRANSACT", paymentCode, paymentCodeStatus, data.transactionId]
            db.query(sqlPayment.UpdateByTransactionId, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {
                    // lets get the purchase details and display
                    var params = [data.transactionId]
                    db.query(sqlPayment.getInfoByTransactionId, params, function (err, result) {
                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        }

                        if (result.length == 0) {
                            res.json({
                                "code": errorCode,
                                "message": "purchase info could not be found"
                            })
                            return;
                        } else {

                            res.json({
                                "code": successCode,
                                "message": "Code was successfully generated",
                                "data": result
                            })
                            return;
                        }
                    });

                }
            });
        }
    });

};

/**
 * Confirm Generated Payment Code
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.confirm_code = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.paymentCode) {
        errors.push("No payment code specified");
    }
    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        paymentCode: req.body.paymentCode
    };


    // verify if the payment code is valid 
    var params = [data.paymentCode]
    db.query(sqlPayment.checkPaymentCode, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (result.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Payment Code does not exist or has already been used"
            })
            return;
        } else {

            // lets get the purchase details and display
            var params = [result[0]["transaction_id"]]
            db.query(sqlPayment.getInfoByTransactionId, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (result.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "purchase info could not be found"
                    })
                    return;
                } else {

                    res.json({
                        "code": successCode,
                        "message": "Code was confirmed successfully",
                        "data": result
                    })
                    return;
                }
            });

        }

    });

};

/**
 * Validate Voucher by driver 
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.validate_voucher = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.voucherCode) {
        errors.push("No voucher code specified");
    }
    if (!req.body.driverId) {
        errors.push("No Driver ID specified");
    }
    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        voucherCode: req.body.voucherCode,
        driverId: req.body.driverId
    };

    // first lets get the driver info by ID
    var params = [data.driverId]
    db.query(sql.driverById, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (result.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find driver"
            })
            return;
        } else {

            // lets select the company Id to fetch details of the company Vouchers 
            var companyId = result[0]["customer_id"];

            // lets fetch details of the company voucher
            var params = [companyId]
            db.query(sqlPayment.voucherByCompanyId, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (result.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "Unable to find company voucher info"
                    })
                    return;
                } else {
                    // lets select only the voucher details

                    var voucherCodeInfo = JSON.parse(JSON.stringify(result[0]["voucher_code"]));
                    var voucherCode = JSON.parse(voucherCodeInfo);


                    for (var i = 0; i < voucherCode.length; i++) {
                        var mainData = voucherCode[i];
                        if ((data.driverId == mainData.driver_id) && ((data.voucherCode).toUpperCase() == (mainData.voucher_code).toUpperCase())) {
                            res.json({
                                "code": successCode,
                                "message": "Voucher Code Validated",
                                "data": mainData
                            })
                            return;
                        }
                    }

                    res.json({
                        "code": errorCode,
                        "message": "Unable to validate voucher"
                    })
                    return;
                }
            });

        }
    });

};

/**
 * Verify and Pay
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.verify_and_pay = function (req, res) {
    // create an array of errors to return
    var errors = []
    var paymentType = req.body.paymentType;
    var deviceType = req.body.deviceType;
    if (!paymentType) {
        errors.push("No payment type specified");
    }
    if (paymentType.toUpperCase() != "MOMO" && paymentType.toUpperCase() != "VOUCHER") {
        errors.push("Only MOMO or VOUCHER allowed as payment types");
    }
    if (paymentType.toUpperCase() == "MOMO") {
        if (!req.body.momoNumber) {
            errors.push("No momo number specified");
        }
        if (!req.body.momoNetwork) {
            errors.push("No momo network specified");
        }
    }
    if (deviceType.toUpperCase() != "POS" && deviceType.toUpperCase() != "NO-POS") {
        errors.push("Only POS or NO-POS allowed as device types");
    }

    if (paymentType.toUpperCase() == "VOUCHER") {
        if (!req.body.voucherCode) {
            errors.push("No voucher code specified");
        }
    }

    if (deviceType.toUpperCase() == "POS") {
        if (!req.body.posId) {
            errors.push("No POS ID specified");
        }
    }


    if (!req.body.driverId) {
        errors.push("No Driver ID specified");
    }
    if (!req.body.stationId) {
        errors.push("No Station ID specified");
    }
    if (!req.body.paymentCode) {
        errors.push("No Payment Code specified");
    }
    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        paymentType: req.body.paymentType,
        deviceType: req.body.deviceType,
        driverId: req.body.driverId,
        posId: req.body.posId,
        stationId: req.body.stationId,
        paymentCode: req.body.paymentCode,
        voucherCode: req.body.voucherCode,
        momoNumber: req.body.momoNumber,
        momoNetwork: req.body.momoNetwork
    }

    // first lets get the driver info by ID
    var params = [data.driverId]
    db.query(sql.driverById, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (result.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find driver"
            })
            return;
        } else {

            var driversData = result;
            // now lets check the payment code
            var params = [data.paymentCode]
            db.query(sqlPayment.checkPaymentCode, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (result.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "Payment Code does not exist or has already been used"
                    })
                    return;
                } else {
                    // first lets check if POS was used so that we validate it 
                    if (deviceType.toUpperCase() == "POS") {
                        // now lets check the payment code
                        var params = [data.posId, data.stationId]
                        db.query(sqlPayment.validatePOSandStation, params, function (err, result) {
                            if (err) {
                                res.status(400).json({ "error": err.message })
                                return;
                            }

                            if (result.length == 0) {
                                res.json({
                                    "code": errorCode,
                                    "message": "POS and Fuel station are not valid"
                                })
                                return;
                            } else {

                                // if voucher was selected validate voucher 
                                if (paymentType.toUpperCase() == "VOUCHER") {
                                    // lets select the company Id to fetch details of the company Vouchers 
                                    var companyId = driversData[0]["customer_id"];

                                    // lets fetch details of the company voucher
                                    var params = [companyId]
                                    db.query(sqlPayment.voucherByCompanyId, params, function (err, result) {
                                        if (err) {
                                            res.status(400).json({ "error": err.message })
                                            return;
                                        }

                                        if (result.length == 0) {
                                            res.json({
                                                "code": errorCode,
                                                "message": "Unable to find company voucher info"
                                            })
                                            return;
                                        } else {
                                            // lets select only the voucher details

                                            var voucherCodeInfo = JSON.parse(JSON.stringify(result[0]["voucher_code"]));
                                            var voucherCode = JSON.parse(voucherCodeInfo);


                                            for (var i = 0; i < voucherCode.length; i++) {
                                                var mainData = voucherCode[i];
                                                if ((data.driverId == mainData.driver_id) && ((data.voucherCode).toUpperCase() == (mainData.voucher_code).toUpperCase())) {
                                                    //Make the payment here and update the payment code status to INACTIVE here
                                                    var params = ["INACTIVE", data.posId, data.voucherCode, data.momoNumber, data.momoNetwork, data.paymentCode]
                                                    db.query(sqlPayment.UpdatePaymentStatus, params, function (err, result) {
                                                        if (err) {
                                                            res.status(400).json({ "error": err.message })
                                                            return;
                                                        } else {
                                                            res.json({
                                                                "code": successCode,
                                                                "message": "Payment by voucher was successful"
                                                            })
                                                            return;
                                                        }

                                                    });
                                                }
                                            }

                                            res.json({
                                                "code": errorCode,
                                                "message": "Unable to validate voucher"
                                            })
                                            return;
                                        }
                                    });
                                }

                                // If momo was selected
                                else {
                                    var params = ["INACTIVE", data.posId, data.voucherCode, data.momoNumber, data.momoNetwork, data.paymentCode]
                                    db.query(sqlPayment.UpdatePaymentStatus, params, function (err, result) {
                                        if (err) {
                                            res.status(400).json({ "error": err.message })
                                            return;
                                        } else {
                                            res.json({
                                                "code": successCode,
                                                "message": "Payment by MOMO was successful"
                                            })
                                            return;
                                        }

                                    });
                                }
                            }
                        });
                    }

                    // If no POS was selected
                    else {
                        // if voucher was selected validate voucher 
                        if (paymentType.toUpperCase() == "VOUCHER") {
                            // lets select the company Id to fetch details of the company Vouchers 
                            var companyId = driversData[0]["customer_id"];

                            // lets fetch details of the company voucher
                            var params = [companyId]
                            db.query(sqlPayment.voucherByCompanyId, params, function (err, result) {
                                if (err) {
                                    res.status(400).json({ "error": err.message })
                                    return;
                                }

                                if (result.length == 0) {
                                    res.json({
                                        "code": errorCode,
                                        "message": "Unable to find company voucher info"
                                    })
                                    return;
                                } else {
                                    // lets select only the voucher details

                                    var voucherCodeInfo = JSON.parse(JSON.stringify(result[0]["voucher_code"]));
                                    var voucherCode = JSON.parse(voucherCodeInfo);


                                    for (var i = 0; i < voucherCode.length; i++) {
                                        var mainData = voucherCode[i];
                                        if ((data.driverId == mainData.driver_id) && ((data.voucherCode).toUpperCase() == (mainData.voucher_code).toUpperCase())) {
                                            //Make the payment here and update the payment code status to INACTIVE here
                                            var params = ["INACTIVE", data.posId, data.voucherCode, data.momoNumber, data.momoNetwork, data.paymentCode]
                                            db.query(sqlPayment.UpdatePaymentStatus, params, function (err, result) {
                                                if (err) {
                                                    res.status(400).json({ "error": err.message })
                                                    return;
                                                } else {
                                                    res.json({
                                                        "code": successCode,
                                                        "message": "Payment by voucher was successful"
                                                    })
                                                    return;
                                                }

                                            });
                                        }
                                    }

                                    res.json({
                                        "code": errorCode,
                                        "message": "Unable to validate voucher"
                                    })
                                    return;
                                }
                            });
                        }

                        // If momo was selected
                        else {
                            var params = ["INACTIVE", data.posId, data.voucherCode, data.momoNumber, data.momoNetwork, data.paymentCode]
                            db.query(sqlPayment.UpdatePaymentStatus, params, function (err, result) {
                                if (err) {
                                    res.status(400).json({ "error": err.message })
                                    return;
                                } else {
                                    res.json({
                                        "code": successCode,
                                        "message": "Payment by MOMO was successful"
                                    })
                                    return;
                                }

                            });
                        }
                    }
                }
            });

        }
    });

};

/**
 * Auto perform transaction
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.auto_transact = function (req, res) {
    // create an array of errors to return
    var errors = []

    //first we need to check for some data
    //paymentCode, stationId, driverId, 

    if (!req.body.driverId) {
        errors.push("No Driver ID specified");
    }
    if (!req.body.stationId) {
        errors.push("No Station ID specified");
    }
    if (!req.body.paymentCode) {
        errors.push("No Payment Code specified");
    }
    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        driverId: req.body.driverId,
        stationId: req.body.stationId,
        paymentCode: req.body.paymentCode,
    };

    //first lets get the login info of the user
    var params = [data.driverId]
    db.query(sqlUser.checkLoggedInUserById, params, function (err, userData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find mobile app user. Kindly register"
            })
            return;
        } else {

            //lets get the user push notification subscriber id          
            var subscriberNotificationIds = [userData[0].push_notification_id];
            var userNotificationType = "DRIVER";

            // first lets get the company where the driver is coming
            var params = [data.driverId]
            db.query(sql.driverById, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (result.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "Unable to find driver"
                    })
                    return;
                } else {

                    var driversData = result;
                    // now lets check the payment code if it is valid
                    var params = [data.paymentCode]
                    db.query(sqlPayment.checkPaymentCode, params, function (err, paymentCodeData) {
                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        }

                        if (paymentCodeData.length == 0) {

                            //send push notification here
                            helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Payment Issue", "Payment Code does not exist or has already been used", userNotificationType, data.paymentCode);

                            res.json({
                                "code": errorCode,
                                "message": "Payment Code does not exist or has already been used"
                            })
                            return;
                        } else {

                            // lets select the company Id to get details of the company 
                            var companyId = driversData[0]["customer_id"];

                            //now lets get the company Wallet info for this driver
                            var params = [companyId]
                            db.query(sqlPayment.getCompanyWalletById, params, function (err, companyWalletData) {
                                if (err) {
                                    res.status(400).json({ "error": err.message })
                                    return;
                                }

                                if (companyWalletData.length == 0) {
                                    //send push notification here
                                    helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Payment Issue", "Company wallet details for this driver not found", userNotificationType, data.paymentCode);
                                    res.json({
                                        "code": errorCode,
                                        "message": "Company wallet details for this driver not found"
                                    })
                                    return;
                                }
                                else {

                                    //now lets get the fuel station wallet info
                                    var params = [data.stationId];
                                    db.query(sqlPayment.getStationWalletById, params, function (err, stationWalletData) {
                                        if (err) {
                                            res.status(400).json({ "error": err.message })
                                            return;
                                        }

                                        if (stationWalletData.length == 0) {
                                            //send push notification here
                                            helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Payment Issue", "Filling station wallet details not found", userNotificationType, data.paymentCode);
                                            res.json({
                                                "code": errorCode,
                                                "message": "Filling station wallet details not found"
                                            })
                                            return;
                                        }
                                        else {

                                            //now lets pick all the details here
                                            //pick the company wallet number 
                                            var companyWalletId = companyWalletData[0]["custw_id"];
                                            var companyWalletNumber = companyWalletData[0]["wallet_num"];
                                            var companyAuthKey = companyWalletData[0]["authorization_key"];
                                            var companyMerchantToken = companyWalletData[0]["merchant_token"];
                                            //pick the station wallet number
                                            var stationWalletId = stationWalletData[0]["custw_id"];
                                            var stationWalletNumber = stationWalletData[0]["wallet_num"];
                                            var stationWalletTelco = stationWalletData[0]["telco"];

                                            //lets pick the amount
                                            var purchaseAmount = paymentCodeData[0]["amount"];
                                            //convert the main purchase amount from string  to float
                                            var driverPurchaseAmount = parseFloat(purchaseAmount);

                                            //we need to check if the driver has any voucher available and that the amount on the voucher is the same or can settle the fuel purchase amount else go to company pool
                                            // lets get details of the unused vouchers

                                            var params = [data.driverId]
                                            db.query(sqlPayment.getVouchersByParameters, params, function (err, voucherListData) {
                                                if (err) {
                                                    res.status(400).json({ "error": err.message })
                                                    return;
                                                }

                                                //check if there is any voucher found
                                                if (voucherListData.length == 0) {
                                                    //since no voucher was found for this driver, let us use the company pool
                                                    //Let us go ahead and use the company pool

                                                    //We will need to prompt the fleet manager to approve the request 

                                                    //trigger the fleet managers responsible for this company and driver to approve the request
                                                    //first lets get all assigned fleet managers 
                                                    var modifiedDriverId = "%" + data.driverId + "%";
                                                    var params = [companyId, modifiedDriverId]
                                                    db.query(sqlPayment.getAssignedFleetManager, params, function (err, getFleetManagerData) {
                                                        if (err) {
                                                            res.status(400).json({ "error": err.message })
                                                            return;
                                                        }

                                                        if (getFleetManagerData.length == 0) {
                                                            //send push notification here
                                                            helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Payment Issue", "No fleet manager has being assigned to you, kindly contact admin", userNotificationType, data.paymentCode);
                                                            res.json({
                                                                "code": errorCode,
                                                                "message": "No fleet manager was found for this driver, contact admin",
                                                                "paymentType": "NO_ASSIGNED_FLEETMANAGER"
                                                            })
                                                            return;
                                                        }

                                                        else {
                                                            var operationCounter = 0;
                                                            var allFleetManagersIds = [];
                                                            //since fleet manager/s were found lets insert requests into the db
                                                            for (var i = 0; i < getFleetManagerData.length; i++) {
                                                                var mainData = getFleetManagerData[i];
                                                                var requestId = helperFunctions.userIdString();

                                                                var params = [requestId, mainData["user_id"], companyId, data.stationId, data.driverId, data.paymentCode, purchaseAmount, companyWalletId, stationWalletId, "pending", new Date()];
                                                                db.query(sqlPayment.promptFleetManagerApproval, params, function (err, result) {
                                                                    if (err) {
                                                                        res.status(400).json({ "error": err.message })
                                                                        return;

                                                                    }

                                                                });

                                                                //push the ID to an array
                                                                allFleetManagersIds.push(mainData["user_id"]);

                                                                ++operationCounter;
                                                            }

                                                            //if the for loop is done send the message back
                                                            if (operationCounter === getFleetManagerData.length) {
                                                                //send push notification here
                                                                helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Purchase Awaiting Approval", "Your payment request of GHC" + purchaseAmount + " is awaiting approval by your fleet manager. You will be notified once the payment is successful.", userNotificationType, data.paymentCode);

                                                                console.log("Push notification for fleet managers since all vouchers are used or none was found", allFleetManagersIds)

                                                                //lets send to each fleet manager
                                                                for (var i = 0; i < allFleetManagersIds.length; i++) {
                                                                    console.log("am pushing notification data")
                                                                    var mainData = allFleetManagersIds[i];
                                                                    //send push notification here to each assigned fleet manager
                                                                    //first lets get the login info of the fleet manager
                                                                    var params = mainData
                                                                    db.query(sqlUser.checkLoggedInUserById, params, function (err, fleetManagerData) {
                                                                        if (err) {
                                                                            res.status(400).json({ "error": err.message })
                                                                            return;
                                                                        }

                                                                        if (fleetManagerData.length == 0) {
                                                                            console.log("fleet manager with user id " + mainData + " was not found");
                                                                        } else {

                                                                            //lets get the user push notification subscriber id          
                                                                            var fleetManagerSubscriberNotificationIds = [fleetManagerData[0].push_notification_id];
                                                                            var fleetManagerUserNotificationType = "FLEETMANAGER";
                                                                            //send the push notification here
                                                                            helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Approval Request", "A payment request of GHC" + purchaseAmount + " is awaiting your approval on your pending lists.", fleetManagerUserNotificationType,data.paymentCode);
                                                                        }
                                                                    });
                                                                }


                                                                res.json({
                                                                    "code": successCode,
                                                                    "message": "Your payment request of GHC" + purchaseAmount + " is awaiting approval by your fleet manager. You will be notified once the payment is successful.",
                                                                    "paymentType": "COMPANYPOOL"
                                                                })
                                                                return;
                                                            }
                                                        }

                                                    });

                                                } else {
                                                    // lets select only the voucher details
                                                    // var voucherCodeId = voucherListData[0]["fv_id"];
                                                    // var voucherCode = JSON.parse(helperFunctions.atou(result[0]["voucher_code"]));
                                                    var voucherCode = voucherListData;

                                                    // console.log("voucherlistData--> ", voucherListData);

                                                    //this is to count the forloops so that we can execute the company pool when the condition for the voucher fails
                                                    var operationsCompleted = 0;

                                                    for (var i = 0; i < voucherCode.length; i++) {
                                                        var mainData = voucherCode[i];

                                                        //check if the voucher type is single or multiple

                                                        //check if driver id matches with the voucher and also if the amount is the same 

                                                        //lets check the voucher type

                                                        //MULTIPLE USE VOUCHERS
                                                        if (((mainData.voucher_type).toUpperCase() == "MULTIPLE_USE") && ((purchaseAmount) <= parseFloat(mainData.balance))) {

                                                            //AN API CALL TO MTN MOMO will be done here for debit and credit
                                                            var referenceNumber = helperFunctions.referenceGenerate();
                                                            var paymentDesc = "Multiple Voucher Fuel Payment"

                                                            //fetch the http body options from helperfunction
                                                            var options = helperFunctions.MOMOAPIOPTIONS(companyAuthKey, companyMerchantToken, purchaseAmount, paymentDesc, referenceNumber, stationWalletNumber, stationWalletTelco, callBackurl);

                                                            console.log("options returned from functions ", options);
                                                            request(options, function (error, response) {
                                                                if (error) {
                                                                    console.log("Error occured while calling the MOMO API-->", error);
                                                                    //send push notification here
                                                                    helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Voucher Payment Failed", "Your payment of GHC" + purchaseAmount + " from your voucher could not be processed at this time.", userNotificationType, data.paymentCode);
                                                                    res.json({
                                                                        "code": errorCode,
                                                                        "message": "OOPS! An error occured when try to reach the Payment Gateway. Please try again",

                                                                    });
                                                                    return;
                                                                }

                                                                //convert the invalid string object to a valid JSON Object
                                                                var responseBody = JSON.parse(`[${response.body}]`);
                                                                var apiCallResponse = responseBody[0];
                                                                console.log("Response Body from MOMO API", apiCallResponse);

                                                                //Since no error occured, cheeck the status of the call here

                                                                if (apiCallResponse.status == false) {
                                                                    //send push notification here
                                                                    helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Voucher Payment Failed", "Your payment of GHC" + purchaseAmount + " from your voucher could not be processed at this time.", userNotificationType, data.paymentCode);
                                                                    res.json({
                                                                        "code": errorCode,
                                                                        "message": apiCallResponse.statusMsg
                                                                    });
                                                                    return;
                                                                }
                                                                
                                                                else if (apiCallResponse.status == true) {

                                                                    //since the MTN MOMO was successful, update the status of the voucher code to used

                                                                    //lets calculate the rembalance
                                                                    var newBalance = (parseFloat(mainData.balance) - purchaseAmount);

                                                                    var usageStatus = "";
                                                                    if ((purchaseAmount) == parseFloat(mainData.balance)) {
                                                                        usageStatus = "used";
                                                                    }
                                                                    else {
                                                                        usageStatus = "unused";
                                                                    }

                                                                    var params = [usageStatus, newBalance.toString(), mainData.voucher_id];
                                                                    db.query(sqlPayment.UpdateVoucherUsageStatus, params, function (err, voucherUpdateData) {
                                                                        if (err) {
                                                                            res.status(400).json({ "error": err.message })
                                                                            return;
                                                                        } else {
                                                                            //update the payment code status to INACTIVE here
                                                                            var params = ["INACTIVE", mainData.voucher_code, driverPurchaseAmount, companyWalletId, stationWalletId, data.paymentCode]
                                                                            db.query(sqlPayment.UpdatePaymentStatusByVoucher, params, function (err, result) {
                                                                                if (err) {
                                                                                    res.status(400).json({ "error": err.message })
                                                                                    return;
                                                                                } else {
                                                                                    //send push notification here
                                                                                    helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Payment Successful", "Your Payment of GHC" + apiCallResponse.amount + " by multiple type voucher was successful with transaction ID: " + apiCallResponse.transRef, userNotificationType);
                                                                                    res.json({
                                                                                        "code": successCode,
                                                                                        "message": "Payment of GHC" + apiCallResponse.amount + " by multiple type voucher was successful with transaction ID: " + apiCallResponse.transRef,
                                                                                        "data": apiCallResponse,
                                                                                        "paymentType": "MULTIPLE_VOUCHER"
                                                                                    });
                                                                                    return;
                                                                                }

                                                                            });
                                                                        }

                                                                    });

                                                                }

                                                                else {
                                                                    //send push notification here
                                                                    helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Voucher Payment Failed", "Your payment of GHC" + purchaseAmount + " from your voucher could not be processed at this time.", userNotificationType);
                                                                    res.json({
                                                                        "code": errorCode,
                                                                        "message": "Payment Gateway failed to process transaction"
                                                                    })
                                                                    return;
                                                                }
                                                            });
                                                            break;
                                                        }

                                                        //SINGLE USE VOUCHERS
                                                        if (((mainData.voucher_type).toUpperCase() == "SINGLE_USE") && ((purchaseAmount) == parseFloat(mainData.balance))) {

                                                            //AN API CALL TO MTN MOMO will be done here for debit and credit
                                                            var referenceNumber = helperFunctions.referenceGenerate();
                                                            var paymentDesc = "Single Voucher Fuel Payment"

                                                            //fetch the http body options from helperfunction
                                                            var options = helperFunctions.MOMOAPIOPTIONS(companyAuthKey, companyMerchantToken, purchaseAmount, paymentDesc, referenceNumber, stationWalletNumber, stationWalletTelco, callBackurl);

                                                            console.log("options returned from functions ", options);
                                                            request(options, function (error, response) {
                                                                if (error) {
                                                                    console.log("Error occured while calling the MOMO API-->", error);
                                                                    //send push notification here
                                                                    helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Voucher Payment Failed", "Your payment of GHC" + purchaseAmount + " from your voucher could not be processed at this time.", userNotificationType);
                                                                    res.json({
                                                                        "code": errorCode,
                                                                        "message": "OOPS! An error occured when try to reach the Payment Gateway. Please try again",

                                                                    });
                                                                    return;
                                                                }

                                                                //convert the invalid string object to a valid JSON Object
                                                                var responseBody = JSON.parse(`[${response.body}]`);
                                                                var apiCallResponse = responseBody[0];
                                                                console.log("Response Body from MOMO API", apiCallResponse);

                                                                //Since no error occured, cheeck the status of the call here

                                                                if (apiCallResponse.status == false) {
                                                                    //send push notification here
                                                                    helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Voucher Payment Failed", "Your payment of GHC" + purchaseAmount + " from your voucher could not be processed at this time.", userNotificationType);

                                                                    res.json({
                                                                        "code": errorCode,
                                                                        "message": apiCallResponse.statusMsg
                                                                    });
                                                                    return;
                                                                }

                                                                else if (apiCallResponse.status == true) {
                                                                    //since the MTN MOMO was successful, update the status of the voucher code to used

                                                                    var params = ["used", "0", mainData.voucher_id];
                                                                    db.query(sqlPayment.UpdateVoucherUsageStatus, params, function (err, voucherUpdateData) {
                                                                        if (err) {
                                                                            res.status(400).json({ "error": err.message })
                                                                            return;
                                                                        } else {
                                                                            //update the payment code status to INACTIVE here
                                                                            var params = ["INACTIVE", mainData.voucher_code, driverPurchaseAmount, companyWalletId, stationWalletId, data.paymentCode]
                                                                            db.query(sqlPayment.UpdatePaymentStatusByVoucher, params, function (err, result) {
                                                                                if (err) {
                                                                                    res.status(400).json({ "error": err.message })
                                                                                    return;
                                                                                } else {
                                                                                    //send push notification here
                                                                                    helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Payment Successful", "Your Payment of GHC" + apiCallResponse.amount + " by single type voucher was successful with transaction ID: " + apiCallResponse.transRef, userNotificationType);
                                                                                    res.json({
                                                                                        "code": successCode,
                                                                                        "message": "Payment of GHC" + apiCallResponse.amount + " by single type voucher was successful with transaction ID: " + apiCallResponse.transRef,
                                                                                        "data": apiCallResponse,
                                                                                        "paymentType": "SINGLE_VOUCHER"
                                                                                    });
                                                                                    return;
                                                                                }

                                                                            });
                                                                        }

                                                                    });

                                                                }

                                                                else {
                                                                    //send push notification here
                                                                    helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Voucher Payment Failed", "Your payment of GHC" + purchaseAmount + " from your voucher could not be processed at this time.", userNotificationType);
                                                                    res.json({
                                                                        "code": errorCode,
                                                                        "message": "Payment Gateway failed to process transaction"
                                                                    })
                                                                    return;
                                                                }

                                                            });
                                                            break;
                                                        }

                                                        //increament the count by 1
                                                        ++operationsCompleted;

                                                    }

                                                    // console.log("complete-->> ",operationsCompleted)

                                                    //This shows that no voucher was able to pay the fuel amount 
                                                    if (operationsCompleted === voucherCode.length) {

                                                        var finalOperationCounter = 0;
                                                        //trigger the fleet managers responsible for this company and driver to approve the request
                                                        //first lets get all assigned fleet managers 
                                                        var modifiedDriverId = "%" + data.driverId + "%";
                                                        var params = [companyId, modifiedDriverId]
                                                        db.query(sqlPayment.getAssignedFleetManager, params, function (err, getFleetManagerData) {
                                                            if (err) {
                                                                res.status(400).json({ "error": err.message })
                                                                return;
                                                            }

                                                            if (getFleetManagerData.length == 0) {
                                                                //send push notification here
                                                                helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Payment Issue", "No fleet manager has being assigned to you, kindly contact admin", userNotificationType);
                                                                res.json({
                                                                    "code": errorCode,
                                                                    "message": "No fleet manager was found for this driver, contact admin",
                                                                    "paymentType": "NO_ASSIGNED_FLEETMANAGER"
                                                                })
                                                                return;
                                                            }

                                                            else {
                                                                var allFleetManagersIds = [];
                                                                //since fleet manager/s were found lets insert requests into the db
                                                                for (var i = 0; i < getFleetManagerData.length; i++) {
                                                                    var mainData = getFleetManagerData[i];
                                                                    var requestId = helperFunctions.userIdString();
                                                                    var params = [requestId, mainData["user_id"], companyId, data.stationId, data.driverId, data.paymentCode, purchaseAmount, companyWalletId, stationWalletId, "pending", new Date()];
                                                                    db.query(sqlPayment.promptFleetManagerApproval, params, function (err, result) {
                                                                        if (err) {
                                                                            res.status(400).json({ "error": err.message })
                                                                            return;
                                                                        }

                                                                    });

                                                                    //push the ID to an array
                                                                    allFleetManagersIds.push(mainData["user_id"]);

                                                                    ++finalOperationCounter;
                                                                }

                                                                //if the for loop is done send the message back
                                                                if (finalOperationCounter === getFleetManagerData.length) {
                                                                    //send push notification here
                                                                    helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Purchase Awaiting Approval", "Your payment request of GHC" + purchaseAmount + " is awaiting approval by your fleet manager. You will be notified once the payment is successful.", userNotificationType);
                                                                    console.log("am about to check push notiication array no voucher was able to pay", allFleetManagersIds)
                                                                    //lets send to each fleet manager
                                                                    for (var i = 0; i < allFleetManagersIds.length; i++) {

                                                                        console.log("am pushing notification dataaaaa-----")
                                                                        var mainData = allFleetManagersIds[i];
                                                                        //send push notification here to each assigned fleet manager
                                                                        //first lets get the login info of the fleet manager
                                                                        var params = mainData
                                                                        db.query(sqlUser.checkLoggedInUserById, params, function (err, fleetManagerData) {
                                                                            if (err) {
                                                                                res.status(400).json({ "error": err.message })
                                                                                return;
                                                                            }

                                                                            if (fleetManagerData.length == 0) {
                                                                                console.log("fleet manager with user id " + mainData + " was not found");
                                                                            } else {

                                                                                //lets get the user push notification subscriber id          
                                                                                var fleetManagerSubscriberNotificationIds = [fleetManagerData[0].push_notification_id];
                                                                                var fleetManagerUserNotificationType = "FLEETMANAGER";
                                                                                //send the push notification here
                                                                                helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Approval Request", "A payment request of GHC" + purchaseAmount + " is awaiting your approval on your pending lists.", fleetManagerUserNotificationType);
                                                                            }
                                                                        });
                                                                    }
                                                                    res.json({
                                                                        "code": successCode,
                                                                        "message": "Your payment request of GHC" + purchaseAmount + " is awaiting approval by your fleet manager. You will be notified once the payment is successful.",
                                                                        "paymentType": "COMPANYPOOL"
                                                                    })
                                                                    return;
                                                                }
                                                            }

                                                        });

                                                    }
                                                }
                                            });

                                        }
                                    });
                                }
                            });

                        };
                    });
                }
            });
        }
    });
}


/**
 * Fleet manager company pool request
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.fleetmanager_companypool_request = function (req, res) {
    // create an array of errors to return
    var errors = []

    //first we need to check for some data
    //paymentCode, stationId, driverId, 

    if (!req.body.requestId) {
        errors.push("No Request ID specified");
    }
    if (!req.body.requestType) {
        errors.push("Please specify if its approval or rejection in request type");
    }
    if (req.body.requestType.toUpperCase() == "REJECTED") {
        if (!req.body.rejectionComment) {
            errors.push("No rejection comment specified");
        }
    }
    if (!req.body.fleetManagerId) {
        errors.push("No Fleet Manager ID specified");
    }
    if (!req.body.driverId) {
        errors.push("No Driver ID specified");
    }
    if (!req.body.stationId) {
        errors.push("No Station ID specified");
    }
    if (!req.body.paymentCode) {
        errors.push("No Payment Code specified");
    }
    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        requestId: req.body.requestId,
        requestType: req.body.requestType,
        rejectionComment: req.body.rejectionComment,
        fleetManagerId: req.body.fleetManagerId,
        driverId: req.body.driverId,
        stationId: req.body.stationId,
        paymentCode: req.body.paymentCode
    };

    //first lets get the login info of the user
    var params = [data.driverId]
    db.query(sqlUser.checkLoggedInUserById, params, function (err, userData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find mobile app user. Kindly register"
            })
            return;
        } else {

            //lets get the user push notification subscriber id          
            var subscriberNotificationIds = [userData[0].push_notification_id];
            var userNotificationType = "DRIVER";

            //first lets get the login info of the fleet manager
            var params = [data.fleetManagerId]
            db.query(sqlUser.checkLoggedInUserById, params, function (err, fleetManagerData) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (fleetManagerData.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "Unable to find mobile app user. Kindly register"
                    })
                    return;
                } else {

                    //lets get the user push notification subscriber id          
                    var fleetManagerSubscriberNotificationIds = [fleetManagerData[0].push_notification_id];
                    var fleetManagerUserNotificationType = "FLEETMANAGER";


                    //check request type 
                    if (data.requestType.toUpperCase() == "REJECTED") {
                        //first lets check if the request exists and if the status is still pending
                        var params = [data.paymentCode]
                        db.query(sqlPayment.checkPaymentRequestByRejected, params, function (err, result) {
                            if (err) {
                                res.status(400).json({ "error": err.message })
                                return;
                            }

                            //means that this request has not been worked on so lets continue with the processing
                            if (result.length == 0) {
                                //now lets update this request id approval status to approved
                                var params = ["rejected", new Date(), data.rejectionComment, data.requestId, data.paymentCode]
                                db.query(sqlPayment.updateFleetManagerRejectStatus, params, function (err, result) {
                                    if (err) {
                                        res.status(400).json({ "error": err.message })
                                        return;
                                    } else {

                                        //hence lets delete all request with the same payment code and approval status pending
                                        var params = [data.paymentCode]
                                        db.query(sqlPayment.deleteSamePaymentCodeRequest, params, function (err, result) {
                                            if (err) {
                                                res.status(400).json({ "error": err.message })
                                                return;
                                            } else {
                                                //send the push notification here to fleet manager first
                                                helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Rejected", "You have successfully rejected a payment", fleetManagerUserNotificationType);

                                                //send push notification here to the driver
                                                helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Payment Rejected", "Your payment request has been rejected by your fleet manager with comment - " + data.rejectionComment, userNotificationType);
                                                //since deletion is successful, return success code
                                                res.json({
                                                    "code": successCode,
                                                    "message": "Payment rejected"
                                                })
                                                return;
                                            }
                                        });
                                    }
                                });
                            }
                            //means that this request has already been approved
                            else {
                                //hence lets delete all request with the same payment code and approval status pending
                                var params = [data.paymentCode]
                                db.query(sqlPayment.deleteSamePaymentCodeRequest, params, function (err, result) {
                                    if (err) {
                                        res.status(400).json({ "error": err.message })
                                        return;
                                    } else {
                                        //send the push notification here to fleet manager first
                                        helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Already Approved", "This request has already been approved. Thank you", fleetManagerUserNotificationType);
                                        //hence lets delete all request with the same payment code and approval status pending
                                        res.json({
                                            "code": warningCode,
                                            "message": "This request has already been approved. Thank you"
                                        })
                                        return;
                                    }
                                });
                            }
                        });
                    }

                    else if (data.requestType.toUpperCase() == "APPROVED") {

                        //first lets check if the request exists and if the status is still pending
                        var params = [data.paymentCode]
                        db.query(sqlPayment.checkPaymentRequestByApproved, params, function (err, result) {
                            if (err) {
                                res.status(400).json({ "error": err.message })
                                return;
                            }

                            //this means that the request has not been approved by any fleet manager
                            if (result.length == 0) {

                                // now lets get the company where the driver is coming
                                var params = [data.driverId]
                                db.query(sql.driverById, params, function (err, result) {
                                    if (err) {
                                        res.status(400).json({ "error": err.message })
                                        return;
                                    }

                                    if (result.length == 0) {
                                        res.json({
                                            "code": errorCode,
                                            "message": "Unable to find driver"
                                        })
                                        return;
                                    } else {

                                        var driversData = result;
                                        // now lets check the payment code if it is valid
                                        var params = [data.paymentCode]
                                        db.query(sqlPayment.checkPaymentCode, params, function (err, paymentCodeData) {
                                            if (err) {
                                                res.status(400).json({ "error": err.message })
                                                return;
                                            }

                                            if (paymentCodeData.length == 0) {
                                                //send push notification here
                                                helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Issue", "Payment Code does not exist or has already been used", fleetManagerUserNotificationType);
                                                res.json({
                                                    "code": errorCode,
                                                    "message": "Payment Code does not exist or has already been used"
                                                })
                                                return;
                                            } else {

                                                // lets select the company Id to get details of the company 
                                                var companyId = driversData[0]["customer_id"];

                                                //now lets get the company Wallet info for this driver
                                                var params = [companyId]
                                                db.query(sqlPayment.getCompanyWalletById, params, function (err, companyWalletData) {
                                                    if (err) {
                                                        res.status(400).json({ "error": err.message })
                                                        return;
                                                    }

                                                    if (companyWalletData.length == 0) {
                                                        //send push notification here
                                                        helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Issue", "Company wallet details for this driver not found", fleetManagerUserNotificationType);
                                                        res.json({
                                                            "code": errorCode,
                                                            "message": "Company wallet details for this driver not found"
                                                        })
                                                        return;
                                                    }
                                                    else {

                                                        //now lets get the fuel station wallet info
                                                        var params = [data.stationId];
                                                        db.query(sqlPayment.getStationWalletById, params, function (err, stationWalletData) {
                                                            if (err) {
                                                                res.status(400).json({ "error": err.message })
                                                                return;
                                                            }

                                                            if (stationWalletData.length == 0) {
                                                                //send push notification here
                                                                helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Issue", "Filling station wallet details not found", fleetManagerUserNotificationType);
                                                                res.json({
                                                                    "code": errorCode,
                                                                    "message": "Filling station wallet details not found"
                                                                })
                                                                return;
                                                            }
                                                            else {

                                                                //now lets pick all the details here
                                                                //pick the company wallet number 
                                                                var companyWalletId = companyWalletData[0]["custw_id"];
                                                                var companyWalletNumber = companyWalletData[0]["wallet_num"];
                                                                var companyAuthKey = companyWalletData[0]["authorization_key"];
                                                                var companyMerchantToken = companyWalletData[0]["merchant_token"];
                                                                //pick the station wallet number
                                                                var stationWalletId = stationWalletData[0]["custw_id"];
                                                                var stationWalletNumber = stationWalletData[0]["wallet_num"];
                                                                var stationWalletTelco = stationWalletData[0]["telco"];

                                                                //lets pick the amount
                                                                var purchaseAmount = paymentCodeData[0]["amount"];
                                                                //convert the main purchase amount from string  to float
                                                                var driverPurchaseAmount = parseFloat(purchaseAmount);


                                                                //now lets process the payment
                                                                //Let us go ahead and use the company pool
                                                                //make the API CALL TO MTN MOMO platform 
                                                                //Ensure that the company wallet number is debited and the station wallet number is credited

                                                                //AN API CALL TO MTN MOMO will be done here for debit and credit
                                                                var referenceNumber = helperFunctions.referenceGenerate();
                                                                var paymentDesc = "Fleet Manager Approved Fuel Payment"

                                                                //fetch the http body options from helperfunction
                                                                var options = helperFunctions.MOMOAPIOPTIONS(companyAuthKey, companyMerchantToken, purchaseAmount, paymentDesc, referenceNumber, stationWalletNumber, stationWalletTelco, callBackurl);

                                                                console.log("options returned from functions ", options);
                                                                request(options, function (error, response) {
                                                                    if (error) {
                                                                        //send push notification here
                                                                        helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Failed", "Your payment could not be processed at this time.", fleetManagerUserNotificationType);
                                                                        console.log("Error occured while calling the MOMO API-->", error);
                                                                        res.json({
                                                                            "code": errorCode,
                                                                            "message": "OOPS! An error occured when try to reach the Payment Gateway. Please try again",

                                                                        });
                                                                        return;
                                                                    }

                                                                    //convert the invalid string object to a valid JSON Object
                                                                    var responseBody = JSON.parse(`[${response.body}]`);
                                                                    var apiCallResponse = responseBody[0];
                                                                    console.log("Response Body from MOMO API", apiCallResponse);

                                                                    //since no error occured lets check the status of the response
                                                                    if (apiCallResponse.status == false) {
                                                                        //send push notification here
                                                                        helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Failed", "Your payment could not be processed at this time.", fleetManagerUserNotificationType);
                                                                        res.json({
                                                                            "code": errorCode,
                                                                            "message": apiCallResponse.statusMsg
                                                                        });
                                                                        return;
                                                                    }


                                                                    else if (apiCallResponse.status == true) {

                                                                        //if MTN MOMO Payment is successful, update DB with below info
                                                                        var params = ["INACTIVE", driverPurchaseAmount, companyWalletId, stationWalletId, data.paymentCode]
                                                                        db.query(sqlPayment.UpdatePaymentStatusByCompanyPool, params, function (err, result) {
                                                                            if (err) {
                                                                                res.status(400).json({ "error": err.message })
                                                                                return;
                                                                            } else {

                                                                                //now lets update this request id approval status to approved
                                                                                var params = ["approved", new Date(), data.requestId, data.paymentCode]
                                                                                db.query(sqlPayment.updateFleetManagerRequestStatus, params, function (err, result) {
                                                                                    if (err) {
                                                                                        res.status(400).json({ "error": err.message })
                                                                                        return;
                                                                                    } else {

                                                                                        //hence lets delete all request with the same payment code and approval status pending
                                                                                        var params = [data.paymentCode]
                                                                                        db.query(sqlPayment.deleteSamePaymentCodeRequest, params, function (err, result) {
                                                                                            if (err) {
                                                                                                res.status(400).json({ "error": err.message })
                                                                                                return;
                                                                                            } else {
                                                                                                //send the push notification here to fleet manager first
                                                                                                helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Approved", "You have successfully approved a payment", fleetManagerUserNotificationType);

                                                                                                //send push notification here to the driver
                                                                                                helperFunctions.PUSHNOTIFICATIONAPI(subscriberNotificationIds, "Payment Approved", "Your payment request has been approved by your fleet manager.", userNotificationType);
                                                                                                //since deletion is successful, return success code
                                                                                                res.json({
                                                                                                    "code": successCode,
                                                                                                    "message": "Payment initiated by fleet manager was successful"
                                                                                                })
                                                                                                return;
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });

                                                                            }

                                                                        });
                                                                    }

                                                                    else {
                                                                        //send push notification here
                                                                        helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Failed", "Your payment could not be processed at this time.", fleetManagerUserNotificationType);
                                                                        res.json({
                                                                            "code": warningCode,
                                                                            "message": "Payment Gateway failed to process transaction"
                                                                        })
                                                                        return;
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            };
                                        });
                                    }
                                });
                            }

                            //means that this request has already been approved
                            else {
                                //hence lets delete all request with the same payment code and approval status pending
                                var params = [data.paymentCode]
                                db.query(sqlPayment.deleteSamePaymentCodeRequest, params, function (err, result) {
                                    if (err) {
                                        res.status(400).json({ "error": err.message })
                                        return;
                                    } else {
                                        //send the push notification here to fleet manager first
                                        helperFunctions.PUSHNOTIFICATIONAPI(fleetManagerSubscriberNotificationIds, "Payment Already Approved", "This request has already been approved. Thank you", fleetManagerUserNotificationType);
                                        //hence lets delete all request with the same payment code and approval status pending
                                        res.json({
                                            "code": warningCode,
                                            "message": "This request has already been approved. Thank you"
                                        })
                                        return;
                                    }
                                });
                            }
                        });
                    }

                    else {
                        res.json({
                            "code": warningCode,
                            "message": "No request type was specified"
                        })
                        return;
                    }
                }
            });
        }
    });
}

/**
 * This is for checking account balance of wallets from wiztransact
 * @param {*} req 
 * @param {*} res 
 */
exports.check_wallet_balance = function (req, res) {
    // create an array of errors to return
    var errors = [];

    if (!req.body.merchant_token) {
        errors.push("No merchant token specified");
    }
    if (!req.body.authorization_key) {
        errors.push("API Key is missing");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    //creae data body
    var data = {
        merchantToken: req.body.merchant_token,
        authorization: req.body.authorization_key
    };


    //fetch the http body options from helperfunction
    var options = helperFunctions.CHECK_WALLET_BALANCE_OPTIONS(data.authorization, data.merchantToken);

    console.log("options returned from functions ", options);
    request(options, function (error, response) {
        if (error) {
            console.log("Error occured while calling the wallet balance API-->", error);
            //send push notification here
            res.json({
                "code": errorCode,
                "message": "OOPS! An error occured when try to reach the Wallet Balance Gateway. Please try again"
            });
            return;
        }

        //convert the invalid string object to a valid JSON Object
        var responseBody = JSON.parse(`[${response.body}]`);
        var apiCallResponse = responseBody[0];
        console.log("Response Body from Wallet Balance API", apiCallResponse);

        //Since no error occured, cheeck the status of the call here

        if (apiCallResponse.status == false) {
            res.json({
                "code": errorCode,
                "message": apiCallResponse.statusMsg
            });
            return;
        }

        else if (apiCallResponse.status == true) {
            res.json({
                "code": successCode,
                "message": apiCallResponse.statusMsg,
                "data": apiCallResponse.balances
            });
            return;
        }
        else {
            res.json({
                "code": errorCode,
                "message": "OOPS! An error occured when try to reach the Wallet Balance Gateway. Please try again"
            });
            return;
        }

    });
}