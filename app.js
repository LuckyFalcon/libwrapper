var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000;
  bodyParser = require('body-parser');

 app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
 app.use(bodyParser.json({limit: '50mb', extended: true}))

app.use(function(req, res, next) {

  res.header("Access-Control-Allow-Origin", "*");

  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  next();

});

var routes = require('./routes/Routes'); 
routes(app); 

app.listen(port);

console.log('RESTful API server started on: ' + port);
