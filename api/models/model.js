'use strict';
let mysql = require('mysql');
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gpswox_web'
        // host: 'localhost',
        // port: '3306',
        // user: 'root',
        // password: 'KJ8IaGNMGXm2B9LJMjkjeeQNafYzUy2I',
        // database: 'gpswox_web'
});

connection.connect(function(err) {
    if (err) {
        return console.error('error: ' + err.message);
    }

    console.log('Connected to the MySQL server.');
});

// Close the database connection
// connection.end(function(err) {
//     if (err) {
//         return console.log('error:' + err.message);
//     }
//     console.log('Closing the database connection.');
// });

// export db module 
module.exports = connection