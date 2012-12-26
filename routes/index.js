/*
 * GET home page.
 */

exports.index = function(req, res) {
	res.render('index', {
		title: 'Express'
	});
};

/*
 * Init redis
 */

var redis = require("redis"),
	client = redis.createClient();

client.on("error", function(err) {
	console.log("Error " + err);
});


exports.save = function(req, res) {
	var params = req.body;
	//checking user existence
	var userNamespace = "user:" + params.login
	client.get(userNamespace, function(err, reply) {
		if(!reply) {
			res.send({
				status: "userDontExist"
			});
		} else {
			if(reply != params.key) {
				res.send({
					status: "refused"
				});
			}
			var contentPath = userNamespace + ":" + params.path
			client.set(contentPath, params.content, function(err, reply) {
				if(reply) {
					res.send({
						status: "saved"
					});
				} else {
					res.send({
						status: "error"
					});
				}
			})

		}
	})
};

exports.checkUser = function(req, res) {
	var params = req.body;
	//checking user existence
	var userNamespace = "user:" + params.login
	client.get(userNamespace, function(err, reply) {
		if(!reply) {
			res.send({
				status: "userDontExist"
			});
		} else {
			if(reply == params.key) {
				pathsNamespace=userNamespace+":*"
				client.keys(pathsNamespace,function(err,reply){
					var paths=reply;
					for (var i = paths.length - 1; i >= 0; i--) {
						paths[i]=paths[i].substring(pathsNamespace.length-1)
					};
					res.send({
					status: "userExist",
					paths: paths
				});
				});
			} else {
				res.send({
					status: "invalidPassword"
				});
			}
		}
	})
};

exports.createUser = function(req, res) {
	var params = req.body;
	//checking user existence
	var userNamespace = "user:" + params.login

	client.get(userNamespace, function(err, reply) {
		client.set(userNamespace, params.key, function(err, reply) {
			if(!reply) {
				res.send({
					status: "error"
				});
			} else {
				res.send({
					status: "userCreated"
				});
			}
		})
	});

};

exports.load = function(req, res) {
	var params = req.body;
	//checking user existence
	var userNamespace = "user:" + params.login
	client.get(userNamespace, function(err, reply) {
		if(!reply) {
			res.send({
				status: "userDontExist"
			});
		} else {
			if(reply != params.key) {
				res.send({
					status: "refused"
				});
			}
			var contentPath = userNamespace + ":" + params.path
			console.log(params.path)
			client.get(contentPath, function(err, reply) {
				if(reply) {
					res.send({
						status: "loaded",
						content: reply,
						path: params.path
					});
				} else {
					res.send({
						status: "pathDontExist"
					});
				}
			})

		}
	})
};