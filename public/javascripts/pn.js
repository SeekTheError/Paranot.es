/**
* login : the user login
  pass : the user pass, used for aes encryption
  path : the path of the file
  key : the sha1 of login+pass, used as an index in the local store
*/
PN = function() {

	if(!$ || !CryptoJS || !Socket || !textProcessor) {
		console.error("Missing Dependencies");
		return;
	}

	var pn = this;

	// a way to scope some variables at the pn object level;
	Store = {};

	this.ExposedStore = {}

	this.ExposedStore.UUIDS = [];

	/* this variable is used for two purpose:
	 *	on file Creation to autodisplay the new file
	 *	on reload to display the reloaded file
	 */
	Store.nextPath = null;

	this.isInitialized = false,


	/*
	 * Event originated from the user interface
	 */
	(function(pn) {
		$("#connect").click(function(event) {
			event.preventDefault();
			pn.checkUser();
			return false;
		});
		$("#login").keypress(function(event) {
			if(!(event.which == 13)) {
				return true;
			} else {
				$("#pass").focus();
				event.preventDefault();
				return false;
			}
		});

		//trigger the user verification when the enter key is pressed
		$("#pass").keypress(function(event) {
			if(!(event.which == 13)) {
				return true;
			} else {
				event.preventDefault();
				pn.checkUser();
				return false;
			}
		});

		// there is no cookie and no form, so reloading the page will log out
		$("#logout").click(function() {
			window.location = ""
		});

		//Reload the current file
		$("#refresh").click(function(event) {
			event.preventDefault();
			document.getElementById("input").innerHTML = "";
			Store.nextPath = $("#input").data("path");
			pn.checkUser();
			return false;
		})
		/**
		 *Load a file when the user click on a tab
		 *The file to load is determined via the active element bootstrap put on tabs
		 */
		$("#inputs-navs li a.file").live('click', function(event) {
			event.preventDefault();
			pn.load();
			return false;
		})

		$('#deleteFile').live("click", function(event) {
			event.preventDefault();
			var fileName = $("#input").data('path');
			if(!fileName) {
				window.alert("Please select the file that you want to delete first");
				return;
			}
			var toDelete = window.confirm("Are you sure that you want to delete the file " + decodeURIComponent(fileName));
			if(toDelete) {
				pn.deleteFile();
			}
			return false;
		});


		/*
		 * Save when changing file
		 */
		$("#input").focusout(function(event) {
			event.preventDefault();
			pn.save();
		});

		/**
		 * empty the new file box on click
		 */
		$('#newFileName').click(function(event) {
			event.preventDefault();
			$('#newFileName').html("").focus();
			return false;
		});


		/**
		 * Auto save when the content is modified
		 */
		//the time the user has to stop typing for the saved to be performed
		var TIME_OUT_VALUE = 300;
		//the saveStatus var is used in the state machine
		Store.saveStatus = "DONE_TYPING";
		$("#input").keyup(function(e) {
			Store.inputContent = $("#input").val();
			if(Store.saveStatus == "DONE_TYPING") {
				Store.saveStatus = "IS_TYPING";
				$("#saveStatus").html("Saving");
			};
			if(Store.saveStatus == "IS_TYPING") {
				//this variable will show weither the content has been modified after the call to
				//setTimeout. If not it will be saved. Without this, every keyUp event will trigger a save
				var beforeTimeoutInputContent = $("#input").html();
				setTimeout(function() {
					var inputContent = $("#input").html();
					if(Store.saveStatus == "IS_TYPING" && inputContent == beforeTimeoutInputContent) {
						Store.saveStatus = "DONE_TYPING";
						Store.lastSavedInput = inputContent;
						pn.save();
					} else {
						return;
					}
				}, TIME_OUT_VALUE);
			}
		});


		/*
		 *handle ctrl+s to save the #input
		 */
		$("#input").live('keypress', function(event) {
			if(!(event.which == 115 && event.ctrlKey) && !(event.which == 19)) {
				return true;
			} else {
				pn.save();
				event.preventDefault();
				return false;
			}
		});

		/*
		 * Create a file when enter is pressed
		 */
		$("#newFileName").live('keypress', function(event) {
			if(!(event.which == 13)) {
				return true;
			} else {
				pn.createFile($('#newFileName').html());
				event.preventDefault();
				return false;
			}
		});
		/*
		 * Either create a new file if the #newFileName has been modified by the user,
		 * or set the focus on the #newFile
		 */
		$("#addNewFile").click(function(event) {
			event.preventDefault();
			if($('#newFileName i').length > 0) {
				$('#newFileName').html("");
				$('#newFileName').focus();
			} else {
				pn.createFile($('#newFileName').html());
			}
			return false;
		});

		//});
		loadExtensions(pn);
		pn.isInitialized = true;
		console.log("pn is ready");
	})(this);

	/*
	 * Load a file
	 * exposed
	 * path: an optional path (not used internally)
	 */
	this.load = function(path) {
		$("#input").hide();
		var login = $("#login").val();
		var pass = $("#pass").val();
		//The path if a tab is "clicked"
		if(!path) {
			var path = encodeURIComponent($("#inputs-navs li.active a.file").html());
		}
		if(typeof path == "undefined") {
			console.log("aborting, cause: nothing path to load")
		}
		var key = CryptoJS.SHA1(login + pass).toString();
		var url = "load";
		console.log(path)
		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key),
			path: path,
		}
		Socket.emit("loadFile", data);
		pn.getUUIDS();
	}

	this.getUUIDS = function() {
		if(pn.ExposedStore.UUIDS.length < 10000) {
			$.ajax({
				url: "http://" + window.location.host + "/UUID/" + 10000,
				dataType: "json"
			}).success(function(data) {
				pn.ExposedStore.UUIDS = pn.ExposedStore.UUIDS.concat(data.uuids);

			})
		}
	}

	/*
	 * Method to save the current note on the server
	 * exposed
	 */
	this.save = function() {
		var path = $("#input").data('path');
		if(!path) {
			console.error("abort, cause: no path");

		} else {
			$("#saveStatus").html("Saving...");
			var input = textProcessor.getInput(path);
			if(input) {
				var login = $("#login").val();
				var pass = $("#pass").val();

				console.log("saving:", path);
				var content = CryptoJS.AES.encrypt(input, pass).toString();
				var key = CryptoJS.SHA1(login + pass).toString();
				var data = {
					login: encodeURIComponent(login),
					key: encodeURIComponent(key),
					path: path,
					content: content
				}
				Socket.emit('saveFile', data);
			}
			pn.getUUIDS();
		}
	}

	this.send = function(input, path) {
		var login = $("#login").val();
		var pass = $("#pass").val();
		console.log("saving:", path);

		var content = CryptoJS.AES.encrypt(input, pass).toString();
		var key = CryptoJS.SHA1(login + pass).toString();

		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key),
			path: path,
			content: content
		}
		$("#saveStatus").html("Saving");
		Socket.emit('saveFile', data);
	}

	this.createFile = function(path) {
		Store.nextPath = encodeURIComponent(path);
		console.log("creating new file: " + path);
		$("#newFileName").html("<i>New Note</i>")
		var input = $("#input").html();
		var login = $("#login").val();
		var pass = $("#pass").val();
		var init = JSON.stringify([{
			i: 1,
			content: "<div>&nbsp;</div>"
		}]);
		var content = CryptoJS.AES.encrypt(init, pass).toString();
		var key = CryptoJS.SHA1(login + pass).toString();
		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key),
			path: encodeURIComponent(path),
			content: content,
			newFile: true
		}
		Socket.emit("saveFile", data);
	}

	this.deleteFile = function() {
		$("#input").html("");
		var login = $("#login").val();
		var pass = $("#pass").val();
		var path = $("#input").data('path');
		console.log("deleting file: " + path);
		var key = CryptoJS.SHA1(login + pass).toString();

		var url = "/deleteFile";
		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key),
			path: path,
		}
		$("#input").data('path', null);
		$.ajax({
			url: url,
			type: 'POST',
			data: data
		}).done(function(data) {
			dispatch(data);
		});
	}

	/*
	 * This method is called on user connection attempt
	 */

	this.checkUser = function() {
		console.log("checking user");
		var login = $("#login").val();
		var pass = $("#pass").val();
		if(login == "" || pass == "") {
			console.log("abort")
			window.alert("Please enter a login and a password");
			return false;
		}
		$("#input").hide();
		var key = CryptoJS.SHA1(login + pass).toString();

		var url = "/checkUser";
		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key)
		}
		console.log("checkin user: " + login)
		$.ajax({
			url: url,
			type: 'POST',
			data: data
		}).done(function(data) {
			dispatch(data);
		})
	}

	this.createUser = function() {
		console.log("creating user");
		var login = $("#login").val();
		var pass = $("#pass").val();

		var key = CryptoJS.SHA1(login + pass).toString();
		var url = "/createUser";
		var data = {
			login: encodeURIComponent(login),
			key: encodeURIComponent(key)
		}
		console.log("creating user: " + url)
		$.ajax({
			url: url,
			type: 'POST',
			data: data
		}).done(function(data) {
			dispatch(data);
		})
	}

	/*
	 * Decrypt and display a note
	 */
	this.displayContent = function(response, reload) {
		if(response) {
			$("#input").show();
			$("#input").attr('contenteditable', 'true');
			//console.log("displaying", response)
			console.log("displaying: " + response.path);

			var pass = $("#pass").val();

			var raw = CryptoJS.AES.decrypt(response.content, pass);
			var result = CryptoJS.enc.Utf8.stringify(raw);
			var input = document.getElementById('input');

			//Now the 
			if(reload) {
				pn.ExposedStore.modeReload = true;
			}
			Store.lastSavedInput = result.toString();
			$("#input").data('path', response.path);
			pn.currentPath = response.path;
			textProcessor.setOutput(result);
		}
	}

	/*
	 *load or reload the tabs, and load
	 */
	this.initUserInterface = function(tabs) {
		console.log("init User Interface", tabs)
		$("#inputs-navs").html("");
		$(".command").show();
		$("#pass").hide();
		$("#login").hide()
		$("#connect").hide();
		$("#userName").html($("#login").val());
		$('#userName').show();
		$("#logout").show();
		var nav;
		var tab;
		var empty = true;
		for(var i = 0; i < tabs.length; i++) {
			var nav = $('<li>').html('<a class="file" href="#" data-toggle="tab">' + decodeURIComponent(tabs[i]) + '</a>')
			//if next path has been set on the createFile function
			if(Store.nextPath == decodeURIComponent(tabs[i])) {
				$(nav).addClass("active");
				empty = false;
			}
			$("#inputs-navs").append(nav);
		};
		//Autoload 
		if(!empty) {
			pn.load();
		}
	}

	//Route Event originated from a server response

	function dispatch(response) {
		if(response.status == "userCreated") {
			console.log("userCreated");
			pn.checkUser();
			return;
		}
		if(response.status == "userExist") {
			console.log("User Exist");
			$("#input").html("");
			pn.initUserInterface(response.paths);
			return;
		}
		if(response.status == "userDontExist") {
			var create = confirm("This account does not exist, do you want to create it?");
			if(create) {
				pn.createUser();
			}
			return;
		}
		if(response.status == "invalidCredentials") {
			$(".command").hide();
			window.alert("Invalid Password");
			return;
		}

		if(response.status == "fileDeleted") {
			$("#input").data('path', null);
			pn.checkUser();
			return;
		}
		if(response.status == "error") {
			console.error(response.message);
			return;
		}
	}

	Socket.on("fileLoaded", function(data) {
		pn.displayContent(data);
	});

	Socket.on("userCreated", function() {
		console.log("userCreated");
		pn.checkUser();
	});

	Socket.on("userExist", function() {
		console.log("User Exist");
		pn.initUserInterface(response.paths);
	});
	Socket.on("userDontExist", function() {
		var create = confirm("This account does not exist, do you want to create it?");
		if(create) {
			createUser();
		}
	});

	Socket.on("fileCreated", function() {
		console.log("File successfully created");
		pn.checkUser();
	});
	Socket.on("fileAlreadyExist", function() {
		window.alert("This File name is already taken");
	});

	Socket.on("fileDontExist", function(data) {
		console.log("file don't exist");
		//alert("This file have been remove");
	});

	Socket.on("invalidCredentials", function() {
		$(".command").hide();
		window.alert("Invalid Password");
	});
	Socket.on("invalidFileName", function() {
		window.alert("Invalid FileName");
		$('#newFileName').html('<i>New Note</i>');
	});
	Socket.on("fileDeleted", function() {
		pn.checkUser();
	});

	Socket.on("error", function(data) {
		console.error(data);
	});

	Socket.on("fileSaved", function(data) {
		$("#saveStatus").html("Saved");
		console.info("saved");
	});
	Socket.on("invalidFileName", function(data) {
		$window.alert("Invalid FileName");
		$('#newFileName').html('<i>New Note</i>');
	});
	Socket.on("fileUpdated", function(data) {
		console.log("file updated on path:", data.path);
		if(data.path == pn.currentPath) {

			console.log()
			pn.displayContent(data, true)
		}
	});
}


function loadExtensions(pn) {
	console.log("Loading pn extensions");

	//allow to click links on the content editable, and display them in new tabs
	(function() {
		$('#input a').live('click', function(event) {
			if(!pn.currentPath) return;
			event.preventDefault();
			var url = $(event.target).attr("href");
			window.open(url, '_blank');
			window.focus();
		})
		$('#input a').live('hover', function() {
			$('#input').attr("contenteditable", false)
		}, function() {
			if(!pn.currentPath) return;
			$('#input').attr("contenteditable", true)
		});
	})();

}