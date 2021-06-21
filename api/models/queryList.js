'use strict';

let userQueries = {
    "listUsers": "select email, group_id, manager_id from users UNION select email, user_id, name from petrosmart_omc_users",
    "checkLoggedInUser": "select * from petrosmart_api_login where mob = ?",
    "checkLoggedInUserById": "select * from petrosmart_api_login where user_id = ?",
    "updatePushNotificationId": "UPDATE petrosmart_api_login set push_notification_id = COALESCE(?,push_notification_id) WHERE mob = ?"
}

let driverQueries = {
    // "vehicleNamesById": "select veh_id, name from petrosmart_vehicles where veh_id in (?, ?)",
    "driverById": "select * from petrosmart_drivers where driver_id = ?",
    "fetchAllVouchersById": "SELECT DV.*, C.full_name AS CompanyName FROM petrosmart_voucher_list AS DV INNER JOIN petrosmart_fuel_voucher AS CV ON DV.parent_voucher_id = CV.fv_id INNER JOIN petrosmart_customer AS C ON CV.customer = C.cust_id WHERE driver_id = ? ORDER BY created_at DESC",
    "fetchAllTransactionsById": "SELECT PurchaseHistory.*, S.Name AS StationName, S.address AS StationAddress, V.name as VehicleName, V.number_plate AS VehicleRegNo FROM petrosmart_api_purchase_info AS PurchaseHistory INNER JOIN petrosmart_fuel_station AS S ON PurchaseHistory.station = S.station_id INNER JOIN petrosmart_vehicles AS V ON PurchaseHistory.vehicle = V.veh_id where user = ? AND (payment_code_status = 'INACTIVE' OR payment_code_status = 'ACTIVE') ORDER BY created_at DESC",
    "transactionsByYearChart": "select SUM(amount) as total_amount, month(created_at) as month, year(created_at) as year from petrosmart_api_purchase_info where user = ? AND YEAR(created_at) = ? AND payment_code_status = 'INACTIVE' group by YEAR(created_at), MONTH(created_at)",
    "transactionsByMonthChart": "SELECT SUM(amount) AS total_amount, DAYOFMONTH(created_at) AS day, year(created_at) as year FROM petrosmart_api_purchase_info WHERE user = ? AND MONTH(created_at) = ? AND YEAR(created_at) = ? AND payment_code_status = 'INACTIVE' GROUP BY DAYOFMONTH(created_at)",
    "transactionsByWeekChart": "SELECT SUM(amount) AS total_amount, DAYNAME(created_at) AS day_name, year(created_at) as year FROM petrosmart_api_purchase_info WHERE user = ? AND YEARWEEK(created_at) = YEARWEEK(NOW()) AND payment_code_status = 'INACTIVE' GROUP BY DAYOFMONTH(created_at)",
    "fetchTransactionsByMonthYear":"SELECT PurchaseHistory.*, S.Name AS StationName, S.address AS StationAddress, V.name as VehicleName, V.number_plate AS VehicleRegNo FROM petrosmart_api_purchase_info AS PurchaseHistory INNER JOIN petrosmart_fuel_station AS S ON PurchaseHistory.station = S.station_id INNER JOIN petrosmart_vehicles AS V ON PurchaseHistory.vehicle = V.veh_id WHERE user = ? AND MONTH(PurchaseHistory.created_at) = ? AND YEAR(PurchaseHistory.created_at) = ? AND (payment_code_status = 'INACTIVE' OR payment_code_status = 'ACTIVE') ORDER BY created_at DESC",
    "driverInfoById": "select * from petrosmart_drivers where driver_id = ? AND vehicles_selected like ?",
    "driverByPhoneNumber": "select * from petrosmart_drivers where mob = ?",
    "checkLoggedInDriver": "select * from petrosmart_api_login where mob = ?",
    "registerDriver": "INSERT INTO petrosmart_api_login (user_id, otp, password, mob, push_notification_id) VALUES (?,?,?,?,?)",
    "updateOtp": "UPDATE petrosmart_api_login set otp = COALESCE(?,otp) WHERE mob = ?",
    "updatePin": "UPDATE petrosmart_api_login set password = COALESCE(?,password) WHERE mob = ?",
    "submitFeedback": "INSERT INTO petrosmart_api_feedback (title, message, user_id, user_type, created_at, updated_at) VALUES (?,?,?,?,?,?)",
}

let stationQueries = {
    "stationById": "select * from petrosmart_fuel_station where station_id = ?",
    "stationBygps": "select * from petrosmart_fuel_station where gps LIKE ?",
    "allFuelStations": "select * from petrosmart_fuel_station",
    "purchaseInfo": "INSERT INTO petrosmart_api_purchase_info (purchase_id, user, vehicle, station, amount, status, transaction_id, payment_code_status, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
    "getPurchaseById": "select * from petrosmart_api_purchase_info where purchase_id = ?",
    "UpdatePurchaseInfoById": "UPDATE petrosmart_api_purchase_info set status = COALESCE(?,status), transaction_id = COALESCE(?,transaction_id) WHERE purchase_id = ?"
}

let paymentQueries = {
    "getCompanyWalletById": "select * from petrosmart_customer_wallet where customer_selected = ?",

    "getStationWalletById": "select * from petrosmart_fuelstation_wallet where fuel_station_id = ?",

    "UpdatePaymentStatusByCompanyPool": "UPDATE petrosmart_api_purchase_info set payment_code_status = COALESCE(?,payment_code_status), amount = COALESCE(?,amount), company_wallet_id = COALESCE(?,company_wallet_id), station_wallet_id = COALESCE(?,station_wallet_id) WHERE payment_code = ?",
    "UpdatePaymentStatusByVoucher": "UPDATE petrosmart_api_purchase_info set payment_code_status = COALESCE(?,payment_code_status), voucher_code = COALESCE(?,voucher_code), amount = COALESCE(?,amount), company_wallet_id = COALESCE(?,company_wallet_id), station_wallet_id = COALESCE(?,station_wallet_id) WHERE payment_code = ?",

    "UpdateVoucherUsageStatus": "UPDATE petrosmart_voucher_list set usage_status = COALESCE(?,usage_status), balance = COALESCE(?,balance) WHERE voucher_id = ?",
    "getVouchersByParameters": "select * from petrosmart_voucher_list where driver_id = ? AND usage_status = 'unused' ORDER BY created_at DESC",

    "promptFleetManagerApproval": "INSERT INTO petrosmart_fleet_manager_requests (request_id, fleet_manager_id, company_id, station_id, driver_id, payment_code, amount, company_wallet_id, station_wallet_id, approval_flag, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    "getAssignedFleetManager": "select * from petrosmart_fleet_managers where customer_id = ? AND drivers_selected LIKE ? ",
    
    "checkPaymentRequestByApproved": "select * from petrosmart_fleet_manager_requests where payment_code = ? AND approval_flag = 'approved'",
    "checkPaymentRequestByRejected": "select * from petrosmart_fleet_manager_requests where payment_code = ? AND approval_flag = 'rejected'",
    "deleteSamePaymentCodeRequest": "DELETE from petrosmart_fleet_manager_requests where payment_code = ? AND approval_flag = 'pending'",
    "updateFleetManagerRequestStatus": "UPDATE petrosmart_fleet_manager_requests set approval_flag = COALESCE(?,approval_flag), approval_date = COALESCE(?,approval_date) WHERE request_id = ? AND payment_code = ?",
    "updateFleetManagerRejectStatus": "UPDATE petrosmart_fleet_manager_requests set approval_flag = COALESCE(?,approval_flag), rejection_date = COALESCE(?,rejection_date), rejection_comment = COALESCE(?,rejection_comment) WHERE request_id = ? AND payment_code = ?",


    "checkTransactionId": "select * from petrosmart_api_purchase_info where transaction_id = ? AND transaction_id <> 'not_set' AND payment_code_status = 'not_set'",
    "checkPaymentCode": "select * from petrosmart_api_purchase_info where payment_code = ? AND payment_code_status = 'ACTIVE' ",
    "getInfoByTransactionId": "select purchase_id, amount, transaction_id, payment_type, payment_code, payment_code_status from petrosmart_api_purchase_info where transaction_id = ? ",
    "UpdateByTransactionId": "UPDATE petrosmart_api_purchase_info set payment_type = COALESCE(?,payment_type), payment_code = COALESCE(?,payment_code), payment_code_status	= COALESCE(?,payment_code_status) WHERE transaction_id = ?",
    "UpdatePaymentStatus": "UPDATE petrosmart_api_purchase_info set payment_code_status	= COALESCE(?,payment_code_status), pos_id = COALESCE(?,pos_id), voucher_code = COALESCE(?,voucher_code), momo_number = COALESCE(?,momo_number), momo_network = COALESCE(?,momo_network) WHERE payment_code = ?",
    "voucherByCompanyId": "select * from petrosmart_fuel_voucher where customer = ? ORDER BY created_at DESC",
    "validatePOSandStation": "select * from petrosmart_fuel_station where pos_selected = ? AND station_id = ? "
}

let fleetManagerQueries = {
    "checkFleetManagerById": "select * from petrosmart_fleet_managers where user_id = ? ",
    "getRequestsByStatus": "SELECT FM.*, C.full_name AS CompanyName, CW.wallet_num AS CompanyWallet, D.name AS DriverName, D.mob as DriverMobile, S.name AS StationName, S.address AS StationAddress, SW.wallet_num AS StationWallet FROM petrosmart_fleet_manager_requests AS FM INNER JOIN petrosmart_customer AS C ON FM.company_id = C.cust_id INNER JOIN petrosmart_customer_wallet AS CW ON FM.company_wallet_id = CW.custw_id INNER JOIN petrosmart_drivers AS D ON FM.driver_id = D.driver_id INNER JOIN petrosmart_fuel_station AS S ON FM.station_id = S.station_id INNER JOIN petrosmart_fuelstation_wallet AS SW ON FM.station_wallet_id = SW.custw_id WHERE fleet_manager_id = ? AND approval_flag = ? ORDER BY created_at DESC",
    "fleetManagerByPhoneNumber": "select * from petrosmart_fleet_managers where mobile_number = ? ",
}

module.exports = { userQueries, driverQueries, stationQueries, paymentQueries, fleetManagerQueries };