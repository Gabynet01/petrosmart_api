'use strict';
module.exports = function (app) {
    var userTask = require('../controllers/usersController');
    var loginTask = require('../controllers/loginController');
    var driverTask = require('../controllers/driversController');
    var stationTask = require('../controllers/stationController');
    var paymentTask = require('../controllers/paymentController');
    var fleetManagerTask = require('../controllers/fleetManagerController');

    // application Routes
    app.route('/')
        .get(userTask.welcome)

    // login Routes
    app.route('/api/login')
        .post(loginTask.login_by_number)

    app.route('/api/login/reset/check/number')
        .post(loginTask.reset_pin_by_number)

    app.route('/api/login/reset/check/otp')
        .post(loginTask.check_user_otp)

    app.route('/api/login/reset/accept/pin')
        .post(loginTask.accept_pin)

    app.route('/api/login/update/push/notification')
        .post(loginTask.update_push_notification_id)

    // user Routes
    app.route('/api/users')
        .get(userTask.list_all_users)

    /**
     * Driver Routes
     */

    //  Prompt drivers to purchase from a nearby station
    app.route('/api/drivers/prompt')
        .post(driverTask.prompt_driver_to_purchase)

    // To display purchase info
    app.route('/api/drivers/purchase/info')
        .post(driverTask.accept_purchase_info)

    app.route('/api/drivers/apply/rules')
        .post(driverTask.apply_driver_rules)

    app.route('/api/drivers/get/vehicles/:id')
        .get(driverTask.fetch_vehicles_by_id)

    app.route('/api/vehicles/get/drivers/:id')
        .get(driverTask.fetch_drivers_by_vehicle_id)

    app.route('/api/drivers/get/vouchers/:id')
        .get(driverTask.fetch_vouchers_by_id)

    //transaction history 
    app.route('/api/drivers/get/transactions/:id/history')
        .get(driverTask.fetch_transactions_history_by_id)

    app.route('/api/vehicles/get/transactions/:id/history')
        .get(driverTask.fetch_transactions_history_by_vehicle_id)

    app.route('/api/stations/get/transactions/:id/history')
        .get(driverTask.fetch_transactions_history_by_station_id)

    app.route('/api/drivers/get/transactions/:id/month/:selectedMonth/year/:selectedYear/history')
        .get(driverTask.fetch_transactions_history_by_id_month_year)

    app.route('/api/drivers/get/transactions/:id/day/:selectedDay/month/:selectedMonth/year/:selectedYear/history')
        .get(driverTask.fetch_transactions_history_by_id_day_month_year)

    app.route('/api/vehicles/get/transactions/:id/day/:selectedDay/month/:selectedMonth/year/:selectedYear/history')
        .get(driverTask.fetch_transactions_history_by_vehicle_id_day_month_year)

    app.route('/api/stations/get/transactions/:id/day/:selectedDay/month/:selectedMonth/year/:selectedYear/history')
        .get(driverTask.fetch_transactions_history_by_station_id_day_month_year)

    /**
     * Payment Routes
     */
    app.route('/api/payment/generate/code')
        .post(paymentTask.generate_code)

    // app.route('/api/payment/momo/api')
    //     .post(paymentTask.momo_api)

    app.route('/api/payment/confirm/code')
        .post(paymentTask.confirm_code)

    app.route('/api/payment/validate/voucher')
        .post(paymentTask.validate_voucher)

    app.route('/api/payment/verify/pay')
        .post(paymentTask.verify_and_pay)

    app.route('/api/payment/auto/transact')
        .post(paymentTask.auto_transact)

    app.route('/api/payment/fleetmanager/companypool/request')
        .post(paymentTask.fleetmanager_companypool_request)

    // Check wallet balance
    app.route('/api/check/wallet/balance/')
        .post(paymentTask.check_wallet_balance)


    /**
     * Successful Transactions History chart route
     */
    app.route('/api/drivers/chart/:id/yearly/')
        .get(driverTask.yearly_transaction_chart)

    app.route('/api/drivers/chart/:id/monthly/')
        .get(driverTask.monthly_transaction_chart)

    app.route('/api/drivers/chart/:id/weekly/')
        .get(driverTask.weekly_transaction_chart)


    /** 
     * Get Fuel stations via locations
     * 
     */
    app.route('/api/drivers/nearest/fuel/stations/')
        .post(driverTask.nearest_fuel_stations)

    app.route('/api/drivers/:id/fuel/stations/')
        .get(driverTask.all_fuel_stations)

    app.route('/api/stations/all/')
        .get(stationTask.list_all_stations)


    /**
     * Fleet Manager Route
     */
    app.route('/api/fleetmanager/fetch/assigned/:id/requests/:status')
        .get(fleetManagerTask.fetch_assigned_requests_by_status)

    app.route('/api/fleetmanager/assigned/drivers/:id')
        .get(fleetManagerTask.fetch_assigned_drivers)

    app.route('/api/fleetmanager/assigned/vehicles/:id')
        .get(fleetManagerTask.fetch_assigned_vehicles)

    app.route('/api/fleetmanager/all/item/count/:id')
        .get(fleetManagerTask.all_item_count)

    /**
     * Successful Transactions History chart route
     */
    app.route('/api/fleetmanager/drivers/chart/:id/yearly/')
        .get(fleetManagerTask.yearly_transaction_chart)

    app.route('/api/fleetmanager/drivers/chart/:id/monthly/')
        .get(fleetManagerTask.monthly_transaction_chart)

    app.route('/api/fleetmanager/drivers/chart/:id/weekly/')
        .get(fleetManagerTask.weekly_transaction_chart)

    /**
     * Fetch requests by day, month and year
     */

    app.route('/api/fleetmanager/get/requests/:id/day/:selectedDay/month/:selectedMonth/year/:selectedYear/history')
        .get(fleetManagerTask.fetch_requests_history_by_id_day_month_year)

    app.route('/api/fleetmanager/get/requests/:id/period/:period/history')
        .get(fleetManagerTask.fetch_requests_history_by_period)

    /**
     * Submit feedback
     */

    app.route('/api/petrosmart/submit/feedback/')
        .post(driverTask.submit_feedback)

};