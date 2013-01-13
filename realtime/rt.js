
//TODO => better handle of the join room on reconnect

io.sockets.on('connection', function(socket) {
	socket.emit('connected', {
		status: 'connected'
	});

	socket.on('saveFile', function(data) {
		if(!guard(socket, data)) return;
		client.get(getUserNameSpace(data), function(err, reply) {
			if(!reply) {
				socket.emit("userDontExist");
			} else {
				if(reply != data.key) {
					socket.emit("refused");
				} else {
					client.get(getContentPath(data), function(err, reply) {
						if(reply && data.newFile) {
							socket.emit("fileAlreadyExist");
						} else {
							client.set(getContentPath(data), data.content, function(err, reply) {
								if(reply) {
									var status = data.newFile ? "fileCreated" : "fileSaved";
									//directly brodcast a new version
									var toBroadcast={path:data.path,
									content:data.content}
									socket.broadcast.to(getContentPath(data))
												.emit('fileUpdated',toBroadcast);
									status == "fileCreated" ? socket.broadcast.to(getUserNameSpace(data)).emit("fileCreated") : "";
									socket.emit(status)
								} else {
									socket.emit({
										status: "error",
										message: "troube while saving"
									});
								}
							});
						}
					});
				}
			}
		});
	});

	socket.on("loadFile", function(data) {
		if(!guard(socket, data)) return;
		client.get(getUserNameSpace(data), function(err, reply) {
			if(!reply) {
				socket.emit("userDontExist");
			} else {
				if(reply != data.key) {
					socket.emit("invalidCredentials");
				} else {
					//removing old room for the socket
					console.log(socket.id, "leaving all room");
					socket.namespace.manager.rooms = {};
					socket.join(getUserNameSpace(data));
					console.log(socket.id, "joining room ", getUserNameSpace(data));
					client.get(getContentPath(data), function(err, reply) {
						if(reply) {
							//join the new room
							socket.join(getContentPath(data));
							socket.emit("fileLoaded", {
								content: reply,
								path: data.path
							});
						} else {
							socket.emit("fileDontExist");
						}
					})
				}
			}
		})
	});
});

//helper functions

function guard(socket, data) {
	if(!credentialsSet(data)) {
		socket.emit("invalidCredentials");
		return false;
	}
	if(!pathSet(data)) {
		socket.emit("invalidFileName");
		return false;
	}
	return true;
}

function credentialsSet(params) {
	if(params.login == "" || params.key == "") {
		return false;
	}
	return true;
}

function pathSet(params, res) {
	if(params.path == "") {
		return false;
	}
	return true;
}

function getUserNameSpace(params) {
	return "user:" + params.login;
}

/*
 * return the contentPath, witch is the redis key to a specific note
 */
function getContentPath(params) {
	return "user:" + params.login + ":" + params.path;
}