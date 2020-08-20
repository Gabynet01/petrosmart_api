'use strict';
module.exports = function(app) {
    var userTask = require('../controllers/usersController');
    var driverTask = require('../controllers/driversController');

    // application Routes
    app.route('/')
        .get(userTask.welcome)

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

};