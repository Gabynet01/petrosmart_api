'use strict';

var successCode = "200";
var errorCode = "204";

var db = require('../models/model'); //database model loaded here
var allQuery = require('../models/queryList');

var helperFunctions = require('../utilities/helperFunctions');

var sqlFleetManager = allQuery["fleetManagerQueries"];


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
        errors.push("Please specify pending or approved");
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
            //fleet manager exists, so pull records based on status
            var params = [data.fleetManagerId, data.status]
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
    });
}