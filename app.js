/**
 * Module dependencies.
 */

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

//min number of worker 
numCPUs == 1 ? numCPUs = 2 :'';

// code for handling worker, one by cpu unit
if(cluster.isMaster) {
  var timeouts = [];
  function errorMsg(worker) {
    console.error("Something must be wrong with the connection ... " + (worker ? worker.id : ''));
    console.log()

  }
  //when a new worker is connected
  cluster.on('online', function(worker) {
    console.log("new worker online: " + worker.id);
  });
  // when a worker is forked
  cluster.on('fork', function(worker) {
    timeouts[worker.id] = setTimeout(errorMsg, 2000);
  });
  //when the master proccess check a worker 
  cluster.on('listening', function(worker, address) {
    clearTimeout(timeouts[worker.id]);
  });
  //when a worker is terminated
  cluster.on('exit', function(worker, code, signal) {
    clearTimeout(timeouts[worker.id]);
    errorMsg(worker);
    console.log("trying to restart a worker");
    cluster.fork();
  });

  console.log("forking " + numCPUs + "workers")
  // Fork workers.
  for(var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }


}
// code for the forks
else {
  var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    socketio = require('socket.io');

  var app = express();

  port = process.argv[2];

  app.configure(function() {
    app.set('port', port || 80);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.logger("short"));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);

  });

  app.configure('development', function() {
    app.use(express.errorHandler());
  });

  app.get('/', routes.index);
  app.post('/save', routes.save);
  app.post('/load', routes.load);
  app.post('/createUser', routes.createUser);
  app.post('/checkUser', routes.checkUser);
  app.post('/deleteFile', routes.deleteFile);


  var server=http.createServer(app).listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
  });

  io = socketio.listen(server);

  var redisPort = 6379;
  var redisHost = 'localhost';

  var RedisStore = require('socket.io/lib/stores/redis'),
    redis = require('socket.io/node_modules/redis'),
    pub = redis.createClient(redisPort, redisHost),
    sub = redis.createClient(redisPort, redisHost);

  //global redis client
  client = redis.createClient(redisPort, redisHost);

  /*pub.auth(password, function (err) { if (err) throw err; });
sub.auth(password, function (err) { if (err) throw err; });
client.auth(password, function (err) { if (err) throw err; });*/

  io.set('store', new RedisStore({
    redis: redis,
    redisPub: pub,
    redisSub: sub,
    redisClient: client
  }));

var realtime=require('./realtime/rt.js');
}