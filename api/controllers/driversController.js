'use strict';

var successCode = "200";
var errorCode = "204";

var db = require('../models/model'); //database model loaded here
var allQuery = require('../models/queryList');

var helperFunctions = require('../utilities/helperFunctions');

var sql = allQuery["driverQueries"];
var sqlStation = allQuery["stationQueries"];

/**
 * Prompt Driver to purchase fuel
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.prompt_driver_to_purchase = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.driverId) {
        errors.push("No driver specified");
    }
    // if (!req.body.location) {
    //     errors.push("No location specified");
    // }
    if (!req.body.coordinates) {
        errors.push("No coordinates specified");
    }
    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        driverId: req.body.driverId,
        // location: req.body.location.toUpperCase(),
        coordinates: req.body.coordinates,
    }

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

            //lets check if the coordinates sent is the same as that of the filling station
            var params = "%" + [data.coordinates] + "%"
            db.query(sqlStation.stationBygps, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (result.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "Unable to find fuel station"
                    })
                    return;
                } else {

                    res.json({
                        "code": successCode,
                        "message": "Prompting to buy fuel from this station",
                        "data": result
                    })
                    return;

                }

            });
        }

    });
};

/**
 * Accept Purchase Info
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.accept_purchase_info = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.driverId) {
        errors.push("No driver specified");
    }
    if (!req.body.vehicleId) {
        errors.push("No vehicle specified");
    }
    if (!req.body.amount) {
        errors.push("No amount specified");
    }
    if (!req.body.stationId) {
        errors.push("No station specified");
    }
    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        driverId: req.body.driverId,
        vehicleId: req.body.vehicleId,
        amount: req.body.amount,
        station: req.body.stationId
    };

    // lets add the rest of the data here
    var purchaseId = helperFunctions.randomString();
    var status = "Pending";
    var modifiedVehicle = "%" + data.vehicleId + "%";

    var datetime = new Date();
    var created_at = datetime.toISOString();


    // first lets verify if the driver is valid and his vehicle is what is sent 
    var params = [data.driverId, modifiedVehicle]
    db.query(sql.driverInfoById, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (result.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find driver's info"
            })
            return;
        } else {

            // lets check if the station passed is correct
            var params = [data.station]
            db.query(sqlStation.stationById, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (result.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "Unable to find Station info, check station ID"
                    })
                    return;
                } else {
                    // now since info is valid, lets go ahead and add the purchase info

                    var params = [purchaseId, data.driverId, data.vehicleId, data.station, data.amount, status, "not_set", "not_set", created_at]

                    db.query(sqlStation.purchaseInfo, params, function (err, result) {
                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        } else {

                            //lets get the data that was pushed and return it
                            var params = [purchaseId]
                            db.query(sqlStation.getPurchaseById, params, function (err, result) {
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
                                        "message": "Purchase Info Created",
                                        "data": result
                                    })
                                    return;
                                }
                            });
                        }

                    });
                }
            });
        }
    });



};

/**
 * Apply driver rules to purchase and generate transaction Id needed
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.apply_driver_rules = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.purchaseId) {
        errors.push("No purchase ID specified");
    }
    if (!req.body.driverId) {
        errors.push("No driver specified");
    }
    if (!req.body.vehicleId) {
        errors.push("No vehicle specified");
    }
    if (!req.body.amount) {
        errors.push("No amount specified");
    }
    if (!req.body.stationId) {
        errors.push("No station specified");
    }
    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        purchaseId: req.body.purchaseId,
        driverId: req.body.driverId,
        vehicleId: req.body.vehicleId,
        amount: req.body.amount,
        station: req.body.stationId
    };

    // lets add the rest of the data here

    var status = "Pending";
    var modifiedVehicle = "%" + data.vehicleId + "%";

    // first lets verify if the driver is valid and his vehicle is what is sent 
    var params = [data.driverId, modifiedVehicle]
    db.query(sql.driverInfoById, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (result.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find driver's info"
            })
            return;
        } else {

            //lets check if the rules set are empty or null

            //check if request is empty
            if (result[0].set_rules == null || result[0].set_rules == undefined || result[0].set_rules == "") {
                res.json({
                    "code": errorCode,
                    "message": "No rules have been set for this driver",
                })
                return;
            }

            // lets pull the rules here 
            var setRules = JSON.parse(helperFunctions.atou(result[0].set_rules));
            var parsedRules = setRules;
            // select the daily amount 

            var dailyAmount = parseFloat(parsedRules[0].dailyAmountLimit);
            var dailyTransactionLimit = parseFloat(parsedRules[0].dailyTransactionLimit);
            var weeklyAmountLimit = parseFloat(parsedRules[0].weeklyAmountLimit);

            if (data.amount > dailyAmount) {
                res.json({
                    "code": errorCode,
                    "message": "oops, you have exceeded your daily amount limit"
                })

                return;
            }

            if (data.amount > dailyTransactionLimit) {
                res.json({
                    "code": errorCode,
                    "message": "oops, you have exceeded your daily transaction limit"
                })
                return;
            } else {
                var transaction_id = helperFunctions.randomString();
                var params = ["Confirmed", transaction_id, data.purchaseId]
                db.query(sqlStation.UpdatePurchaseInfoById, params, function (err, result) {
                    if (err) {
                        res.status(400).json({ "error": err.message })
                        return;
                    } else {
                        // lets get the purchase details and display
                        var params = [data.purchaseId]
                        db.query(sqlStation.getPurchaseById, params, function (err, result) {
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
                                    "message": "Purchase has been successfully confirmed",
                                    "data": result
                                })
                                return;
                            }
                        });

                    }

                });
            }

        }
    });

};


/**
 * Fetch driver vehicles by ID
 * Request - GET
 * Params {jsonBodyItems}
 */
exports.fetch_vehicles_by_id = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No driver ID specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        driverId: req.params.id
    }

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

            //once driver is found lets get the vehicles selected

            console.log(result[0]["vehicles_selected"]);
            var driverVehicles = result[0]["vehicles_selected"];

            //check if request is empty
            if (driverVehicles == null || driverVehicles == undefined || driverVehicles == "") {
                res.json({
                    "code": errorCode,
                    "message": "No vehicles have been assigned for this driver",
                })
                return;
            }
            var allVehiclesIds = driverVehicles.split(",");

            console.log(allVehiclesIds.length)
            var editedArrays = [];
            for (var i = 0; i < allVehiclesIds.length; i++) {
                var mainData = "'" + allVehiclesIds[i] + "'"
                editedArrays.push(mainData);
            }

            var queryArray = editedArrays.toString();

            var vehicleNamesById = "select veh_id, name, model, make, number_plate, fuel_type from petrosmart_vehicles where veh_id in (" + queryArray + ") AND drivers_selected LIKE '%" + data.driverId + "%'";

            console.log(vehicleNamesById)
            // lets loop through

            db.query(vehicleNamesById, allVehiclesIds, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {
                    res.json({
                        "code": successCode,
                        "message": "Vehicles retrieved successfully",
                        "data": result
                    })
                    return;
                }

            })

        }

    });
};

/**
 * Fetch driver vouchers by ID
 * Request - GET
 * Params {jsonBodyItems}
 */
exports.fetch_vouchers_by_id = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No driver ID specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        driverId: req.params.id
    }

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
            //lets pull the voucher list for this driver          

            var params = [data.driverId]
            db.query(sql.fetchAllVouchersById, params, function (err, responseData) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (responseData.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "No voucher has been created for you"
                    })
                    return;
                } else {

                    res.json({
                        "code": successCode,
                        "message": "Vouchers pulled successfully",
                        "data": responseData
                    })
                    return;

                }
            });
        }

    });
};


/**
 * Fetch driver transaction history by ID
 * Request - GET
 * Params {jsonBodyItems}
 */
exports.fetch_transactions_history_by_id = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No driver ID specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        driverId: req.params.id
    }

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
            //lets pull the transactions for this driver          

            var params = [data.driverId]
            db.query(sql.fetchAllTransactionsById, params, function (err, responseData) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (responseData.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "No transaction history was found"
                    })
                    return;
                } else {

                    res.json({
                        "code": successCode,
                        "message": "Transaction history pulled successfully",
                        "data": responseData
                    })
                    return;

                }
            });
        }

    });
};


/**
 * get driver purchase info by ID
 * Request - GET
 * Params {jsonBodyItems}
 */
exports.driver_dashboard = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No driver ID specified");
    }
    if (!req.params.selectedYear) {
        errors.push("No selected year specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        driverId: req.params.id,
        selectedYear: req.params.selectedYear
    }

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
            var params = [data.driverId, data.selectedYear]
            db.query(sql.dashboardById, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {
                    res.json({
                        "code": successCode,
                        "message": "Dashboard retrieved successfully",
                        "data": result
                    })
                    return;
                }
            })
        }

    });
};