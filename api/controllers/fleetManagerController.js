'use strict';

var successCode = "200";
var errorCode = "204";
/**
 * getFullYear() – Provides current year like 2018.
    getMonth() – Provides current month values 0-11. Where 0 for Jan and 11 for Dec. So added +1 to get result.
    getDate() – Provides day of the month values 1-31.
 */

var currentDate = new Date();
var getDay = currentDate.getDate();
var getMonth = currentDate.getMonth(); // 
var fullYear = currentDate.getFullYear();

var db = require('../models/model'); //database model loaded here
var allQuery = require('../models/queryList');

var helperFunctions = require('../utilities/helperFunctions');

var sql = allQuery["driverQueries"];
var sqlFleetManager = allQuery["fleetManagerQueries"];
var sqlStation = allQuery["stationQueries"];

/**
 * fetch all fleet manager requests by status and ID
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.fetch_assigned_requests_by_status = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No fleet manager ID specified");
    }

    if (!req.params.status) {
        errors.push("Please specify all or pending or failed or approved");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        fleetManagerId: req.params.id,
        status: req.params.status
    }

    // lets first check if fleet manager exists
    var params = [data.fleetManagerId, data.status]
    db.query(sqlFleetManager.checkFleetManagerById, params, function (err, userExistsData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userExistsData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find this fleet manager, kindly see admin"
            })
            return;
        } else {

            var params = [data.fleetManagerId, fullYear, data.status]
            //if status is all fetch all regardless of status
            if (data.status.toUpperCase() == "ALL") {
                db.query(sqlFleetManager.getAllRequests, params, function (err, responseData) {
                    if (err) {
                        res.status(400).json({ "error": err.message })
                        return;
                    }

                    if (responseData.length == 0) {
                        res.json({
                            "code": errorCode,
                            "message": "No request found, please check back again later"
                        })
                        return;
                    } else {

                        res.json({
                            "code": successCode,
                            "message": data.status + " requests pulled successfully",
                            "data": responseData
                        })
                        return;

                    }
                });
            }
            else {
                //fleet manager exists, so pull records based on status

                db.query(sqlFleetManager.getRequestsByStatus, params, function (err, responseData) {
                    if (err) {
                        res.status(400).json({ "error": err.message })
                        return;
                    }

                    if (responseData.length == 0) {
                        res.json({
                            "code": errorCode,
                            "message": "No request found, please check back again later"
                        })
                        return;
                    } else {

                        res.json({
                            "code": successCode,
                            "message": data.status + " requests pulled successfully",
                            "data": responseData
                        })
                        return;

                    }
                });
            }
        }
    });
}

/**
 * fetch all assigned drivers to fleet manager ID
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.fetch_assigned_drivers = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No fleet manager ID specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        fleetManagerId: req.params.id
    }

    // lets first check if fleet manager exists
    var params = [data.fleetManagerId, data.status]
    db.query(sqlFleetManager.checkFleetManagerById, params, function (err, userExistsData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userExistsData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find this fleet manager, kindly see admin"
            })
            return;
        } else {
            //fleet manager exists, so pull records based on status
            var params = [data.fleetManagerId]
            db.query(sqlFleetManager.getAssignedDrivers, params, function (err, responseData) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (responseData.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "No request found, please check back again later"
                    })
                    return;
                } else {
                    var driversSelected = responseData[0].drivers_selected;
                    var assignedDrivers = responseData[0].drivers_selected.split(",");

                    //lets fetch driver info by id
                    var params = "";
                    var fetchQry = "select D.*, C.full_name AS CompanyName, C.address AS CompanyAddress, B.name AS BranchName, B.address as BranchAddress from petrosmart_drivers AS D INNER JOIN petrosmart_customer AS C ON D.customer_id = C.cust_id INNER JOIN petrosmart_customer_branch AS B ON D.branch_id = B.custb_id where driver_id in (" + driversSelected + ") ORDER BY D.created_at DESC";
                    // var fetchQry = "select * from petrosmart_drivers where driver_id in (" + driversSelected + ")";
                    db.query(fetchQry, params, function (err, driverData) {
                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        }

                        if (driverData.length == 0) {
                            res.json({
                                "code": errorCode,
                                "message": "No driver data found, please check back again later"
                            })
                            return;
                        }

                        res.json({
                            "code": successCode,
                            "message": "Assigned Drivers pulled successfully",
                            "driverCount": assignedDrivers.length,
                            "data": driverData
                        })
                        return;
                    });

                }
            });
        }
    });
}

/**
 * fetch all assigned vehicles to fleet manager ID
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.fetch_assigned_vehicles = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No fleet manager ID specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        fleetManagerId: req.params.id
    }

    // lets first check if fleet manager exists
    var params = [data.fleetManagerId, data.status]
    db.query(sqlFleetManager.checkFleetManagerById, params, function (err, userExistsData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userExistsData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find this fleet manager, kindly see admin"
            })
            return;
        } else {
            //fleet manager exists, so pull records based on status
            var params = [data.fleetManagerId]
            db.query(sqlFleetManager.getAssignedDrivers, params, function (err, responseData) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (responseData.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "No request found, please check back again later"
                    })
                    return;
                } else {
                    var driversSelected = responseData[0].drivers_selected;
                    var assignedDrivers = responseData[0].drivers_selected.split(",");

                    //lets fetch driver info by id
                    var params = "";
                    var fetchQry = "select vehicles_selected from petrosmart_drivers where driver_id in (" + driversSelected + ")";
                    db.query(fetchQry, params, function (err, driverData) {
                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        }

                        if (driverData.length == 0) {
                            res.json({
                                "code": errorCode,
                                "message": "No vehicle data found, please check back again later"
                            })
                            return;
                        }

                        //since we have the vehicles for these drivers lets get the vehicle info
                        var allVehicleIds = [];
                        for (var i = 0; i < driverData.length; i++) {
                            var mainData = driverData[i]["vehicles_selected"];
                            //check if data contains a comma so that you split it
                            if (mainData.includes(",")) {
                                var splitData = mainData.split(",");
                                for (var j = 0; j < splitData.length; j++) {
                                    allVehicleIds.push("'" + splitData[j] + "'");
                                }
                            } else {
                                allVehicleIds.push("'" + mainData + "'");
                            }
                        }
                        var params = "";
                        // var fetchVehicleQry = "select * from petrosmart_vehicles where veh_id in (" + allVehicleIds + ")";
                        var fetchVehicleQry = "select V.*, D.name AS DriverName, D.driver_id AS DriverId, D.address AS DriverAddress, C.full_name AS CompanyName, C.address AS CompanyAddress, B.name AS BranchName, B.address as BranchAddress from petrosmart_vehicles AS V INNER JOIN petrosmart_customer AS C ON V.customer_id = C.cust_id INNER JOIN petrosmart_customer_branch AS B ON V.branch_id = B.custb_id INNER JOIN petrosmart_drivers AS D ON D.driver_id in (V.drivers_selected) where veh_id in (" + allVehicleIds + ") ORDER BY D.created_at DESC";
                        // console.log(fetchVehicleQry);
                        db.query(fetchVehicleQry, params, function (err, vehicleData) {
                            if (err) {
                                res.status(400).json({ "error": err.message })
                                return;
                            }

                            if (vehicleData.length == 0) {
                                res.json({
                                    "code": errorCode,
                                    "message": "No vehicle data found, please check back again later"
                                })
                                return;
                            }
                            res.json({
                                "code": successCode,
                                "message": "Assigned Vehicles pulled successfully",
                                "vehicleCount": allVehicleIds.length,
                                "data": vehicleData
                            })
                            return;
                        });
                    });

                }
            });
        }
    });
}

/**
 * get all items count by fleet manager ID
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.all_item_count = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No fleet manager ID specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        fleetManagerId: req.params.id
    }

    // lets first check if fleet manager exists
    var params = [data.fleetManagerId, data.status]
    db.query(sqlFleetManager.checkFleetManagerById, params, function (err, userExistsData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userExistsData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find this fleet manager, kindly see admin"
            })
            return;
        } else {
            //fleet manager exists, so pull records based on status
            var params = [data.fleetManagerId]
            db.query(sqlFleetManager.getAssignedDrivers, params, function (err, responseData) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (responseData.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "No request found, please check back again later"
                    })
                    return;
                } else {

                    var driversSelected = responseData[0].drivers_selected;
                    var assignedDrivers = responseData[0].drivers_selected.split(",");

                    //lets get the total driver vehicles counts
                    var params = "";
                    var fetchQry = "select vehicles_selected from petrosmart_drivers where driver_id in (" + driversSelected + ")";
                    db.query(fetchQry, params, function (err, driverData) {
                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        }

                        if (driverData.length == 0) {
                            res.json({
                                "code": errorCode,
                                "message": "No driver data found, please check back again later"
                            })
                            return;
                        }

                        //since we have the vehicles for these drivers lets get the vehicle info
                        var allVehicleIds = [];
                        for (var i = 0; i < driverData.length; i++) {
                            var mainData = driverData[i]["vehicles_selected"];
                            //check if data contains a comma so that you split it
                            if (mainData.includes(",")) {
                                var splitData = mainData.split(",");
                                for (var j = 0; j < splitData.length; j++) {
                                    allVehicleIds.push("'" + splitData[j] + "'");
                                }
                            } else {
                                allVehicleIds.push("'" + mainData + "'");
                            }
                        }

                        //since we have both Driver count and Vehicle Count lets get the stattion count
                        var params = [];
                        db.query(sqlStation.listStations, params, (err, stationData) => {
                            if (err) {
                                res.status(400).json({ "error": err.message });
                                return;
                            }

                            //now lets return everything 
                            res.json({
                                "code": successCode,
                                "message": "All item count pulled successfully",
                                "driverCount": assignedDrivers.length,
                                "vehicleCount": allVehicleIds.length,
                                "stationCount": stationData.length
                            })
                            return;
                        });

                    });
                }
            });
        }
    });
}

/**
 * get driver purchase info by ID
 * Request - GET
 * Params {jsonBodyItems}
 */
exports.yearly_transaction_chart = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No fleet manager ID specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        userId: req.params.id,
    }

    var params = [data.userId]
    db.query(sqlFleetManager.checkFleetManagerById, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (result.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find this fleet manager, kindly see admin"
            })
            return;
        } else {
            var params = [data.userId, fullYear]
            db.query(sqlFleetManager.transactionsByYearChart, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {
                    res.json({
                        "code": successCode,
                        "message": "This year chart data retrieved successfully",
                        "data": result
                    })
                    return;
                }
            })
        }

    });
};

/**
 * get driver transaction history by ID and Month
 * Request - GET
 * Params {jsonBodyItems}
 */
exports.monthly_transaction_chart = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No fleet manager ID specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        userId: req.params.id,
    }

    var params = [data.userId]
    db.query(sqlFleetManager.checkFleetManagerById, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (result.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find this fleet manager, kindly see admin"
            })
            return;
        } else {

            var params = [data.userId, getMonth + 1, fullYear]
            db.query(sqlFleetManager.transactionsByMonthChart, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {
                    res.json({
                        "code": successCode,
                        "message": "This month chartdata retrieved successfully",
                        "data": result
                    })
                    return;
                }
            })
        }

    });
};

/**
 * get fleetmanager transaction history chart weekly
 * Request - GET
 * Params {jsonBodyItems}
 */
exports.weekly_transaction_chart = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No fleet manager ID specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        userId: req.params.id,
    }

    var params = [data.userId]
    db.query(sqlFleetManager.checkFleetManagerById, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (result.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find this fleet manager, kindly see admin"
            })
            return;
        } else {

            var params = [data.userId]
            db.query(sqlFleetManager.transactionsByWeekChart, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {
                    res.json({
                        "code": successCode,
                        "message": "This week chartdata retrieved successfully",
                        "data": result
                    })
                    return;
                }
            })
        }

    });
};

/**
 * Fetch fleet manager request history by ID, Day, Month and Year
 * Request - GET
 * Params {jsonBodyItems}
 */
exports.fetch_requests_history_by_id_day_month_year = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No driver ID specified");
    }
    if (!req.params.selectedDay) {
        errors.push("No day specified");
    }
    if (!req.params.selectedMonth) {
        errors.push("No month specified");
    }
    if (!req.params.selectedYear) {
        errors.push("No year specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        userId: req.params.id,
        selectedDay: req.params.selectedDay,
        selectedMonth: req.params.selectedMonth,
        selectedYear: req.params.selectedYear
    }

    var params = [data.userId]
    db.query(sqlFleetManager.checkFleetManagerById, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (result.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find fleetmanager"
            })
            return;
        } else {
            //lets pull the requests for this fleet manager          

            var params = [data.userId, data.selectedDay, data.selectedMonth, data.selectedYear]
            db.query(sqlFleetManager.fetchRequestsByDayMonthYear, params, function (err, responseData) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (responseData.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "No request history was found"
                    })
                    return;
                } else {

                    res.json({
                        "code": successCode,
                        "message": "Request history pulled successfully",
                        "data": responseData
                    })
                    return;

                }
            });
        }

    });
};

/**
 * Fetch fleet manager request history by ID, Period
 * Request - GET
 * Params {jsonBodyItems}
 */
exports.fetch_requests_history_by_period = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.params.id) {
        errors.push("No driver ID specified");
    }
    if (!req.params.period) {
        errors.push("No period specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        userId: req.params.id,
        period: req.params.period
    }

    var params = [data.userId]
    db.query(sqlFleetManager.checkFleetManagerById, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (result.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find fleetmanager"
            })
            return;
        } else {
            //lets pull the requests for this fleet manager   

            if (data.period.toUpperCase() == "DAY") {
                var params = [data.userId, getDay, getMonth + 1, fullYear]
                db.query(sqlFleetManager.fetchRequestsByDayMonthYear, params, function (err, responseData) {
                    if (err) {
                        res.status(400).json({ "error": err.message })
                        return;
                    }

                    if (responseData.length == 0) {
                        res.json({
                            "code": errorCode,
                            "message": "No request history was found"
                        })
                        return;
                    } else {

                        res.json({
                            "code": successCode,
                            "message": "Request history pulled successfully",
                            "data": responseData
                        })
                        return;

                    }
                });
            }

            if (data.period.toUpperCase() == "MONTH") {

                var params = [data.userId, getMonth + 1, fullYear]
                db.query(sqlFleetManager.fetchRequestsByMonthYear, params, function (err, responseData) {
                    if (err) {
                        res.status(400).json({ "error": err.message })
                        return;
                    }

                    if (responseData.length == 0) {
                        res.json({
                            "code": errorCode,
                            "message": "No request history was found"
                        })
                        return;
                    } else {

                        res.json({
                            "code": successCode,
                            "message": "Request history pulled successfully",
                            "data": responseData
                        })
                        return;

                    }
                });
            }

            if (data.period.toUpperCase() == "YEAR") {
                var params = [data.userId, fullYear]
                db.query(sqlFleetManager.fetchRequestsByYear, params, function (err, responseData) {
                    if (err) {
                        res.status(400).json({ "error": err.message })
                        return;
                    }

                    if (responseData.length == 0) {
                        res.json({
                            "code": errorCode,
                            "message": "No request history was found"
                        })
                        return;
                    } else {

                        res.json({
                            "code": successCode,
                            "message": "Request history pulled successfully",
                            "data": responseData
                        })
                        return;

                    }
                });
            }
        }

    });
};
