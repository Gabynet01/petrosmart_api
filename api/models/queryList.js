'use strict';

let userQueries = {
    "listUsers": "select email, group_id, manager_id from users UNION select email, user_id, name from petrosmart_omc_users"
}

let driverQueries = {
    "driverById": "select * from petrosmart_drivers where driver_id = ?",
    "driverInfoById": "select * from petrosmart_drivers where driver_id = ? AND vehicles_selected like ?"
}

let stationQueries = {
    "stationBygps": "select * from petrosmart_fuel_station where gps LIKE ?",
    "purchaseInfo": "INSERT INTO petrosmart_api_purchase_info (purchase_id, user, vehicle, station, amount, status, transaction_id, created_at) VALUES (?,?,?,?,?,?,?,?)",
    "getPurchaseById": "select * from petrosmart_api_purchase_info where purchase_id = ?",
    "UpdatePurchaseInfoById": "UPDATE petrosmart_api_purchase_info set status = COALESCE(?,status), transaction_id = COALESCE(?,transaction_id) WHERE purchase_id = ?"
}

module.exports = { userQueries, driverQueries, stationQueries };