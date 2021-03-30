'use strict';
module.exports = function (app) {
    var userTask = require('../controllers/usersController');
    var loginTask = require('../controllers/loginController');
    var driverTask = require('../controllers/driversController');
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

    app.route('/api/drivers/get/vouchers/:id')
        .get(driverTask.fetch_vouchers_by_id)

    app.route('/api/drivers/get/transactions/:id/history')
        .get(driverTask.fetch_transactions_history_by_id)

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


    /**
     * Dashbard route
     */
    app.route('/api/drivers/dashboard/:id/year/:selectedYear')
        .get(driverTask.driver_dashboard)


    /**
     * Fleet Manager Route
     */
    app.route('/api/fleetmanager/fetch/assigned/:id/requests/:status')
        .get(fleetManagerTask.fetch_assigned_requests_by_status)

};