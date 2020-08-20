'use strict';
let mysql = require('mysql');
let connection = mysql.createConnection({
    // host: 'localhost',
    // user: 'root',
    // password: '',
    // database: 'gpswox_web'
    host: '95.179.146.30',
    user: 'root',
    password: 'j9#L%oa#rT-XD*3P',
    database: 'gpswox_web'
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