'use strict';

var successCode = "200";
var errorCode = "204";

var db = require('../models/model'); //database model loaded here
var allQuery = require('../models/queryList');
var sql = allQuery["userQueries"];

exports.welcome = function(req, res) {
    res.json({ "message": "Connected" })
};


/**
 * List all users
 * Request - GET
 * no params 
 */
exports.list_all_users = function(req, res) {
    // var sql = "select email, group_id, manager_id from users UNION select email, user_id, name from petrosmart_omc_users";
    var params = [];
    db.query(sql.listUsers, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "code": successCode,
            "message": "success",
            "data": rows
        })
    });
};