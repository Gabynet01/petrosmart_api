var express = require('express'),
    app = express(),
    port = process.env.PORT || 7777,
    bodyParser = require('body-parser');

// use this to handle post requests with body 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var routes = require('./api/routes/routes'); //importing route
routes(app); //register the route


app.listen(port);

console.log('Application started on port: ' + port);

// Insert here other API endpoints

// Default response for any other request
app.use(function(req, res) {
    res.status(404);
});

app.use(require('morgan')('dev'));