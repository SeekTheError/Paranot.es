/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path');

var app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.post('/save', routes.save);
app.post('/load', routes.load);

http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});


var redis = require("redis"),
  client = redis.createClient();

client.on("error", function(err) {
  console.log("Error " + err);
});