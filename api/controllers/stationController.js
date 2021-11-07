'use strict';

var successCode = "200";
var errorCode = "204";

var db = require('../models/model'); //database model loaded here
var allQuery = require('../models/queryList');

var helperFunctions = require('../utilities/helperFunctions');

var sql = allQuery["driverQueries"];
var sqlStation = allQuery["stationQueries"];

/**
 * fetch all stations
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.list_all_stations = function (req, res) {
    var params = [];
    db.query(sqlStation.listStations, params, (err, stationData) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "code": successCode,
            "message": "Success fetching station data",
            "count":stationData.length,
            "data": stationData
        })
        return;
    });
};