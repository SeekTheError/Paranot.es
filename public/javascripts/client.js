var encrypted = CryptoJS.AES.encrypt("Message", "Secret Passphrase");
s = encrypted.toString()
//console.log(s);
var decrypted = CryptoJS.AES.decrypt(s, "Secret Passphrase");
r = CryptoJS.enc.Utf8.stringify(decrypted);
//console.log(r);
/**
* login : the user login
  pass : the user pass, used for aes encryption
  path : the path of the file
  key : the sha1 of login+pass, used as an index in the local store
*/
var pn = function($, CryptoJS) {
		if(!$ || !CryptoJS) {
			console.error("Missing Dependencies");
		}
		// this variable is used for two purpose:
		//on file Creation to autodisplay the new file
		// on reload to display the reloaded file

		this.nextPath=null;
		/*
		* Event originated from the user interface
		*/
		this.init = function() {
			$("#refresh").click(function(event){
				event.preventDefault();
				document.getElementById("input").innerHTML = "";
				nextPath=$("#input").data("path");
				checkUser();
				return false;
			})

			$("#inputs-navs li a.file").live('click', function(event) {
				event.preventDefault();
				load();
				return false;
			})

			$('#deleteFile').live("click",function(){
				event.preventDefault();
				var fileName=$("#input").data('path');
				if(!fileName){
					return;
				}
				var toDelete=window.confirm("Are you sure that you want to delete the file "+fileName);
				if(toDelete){
					deleteFile();
				}
				return false;	
			});

			$("#pass").change(function() {
				$("#inputs-navs").html("");
				$("#input").html("");
				checkUser()
			});
			//autosave before changing account or doc
			$("#input").focusout(function(event) {
				save();
			})
			$('#newFileName').live("click", function(event) {
				event.preventDefault();
				$('#newFileName').html("");
				return false;
			});
			$("#newFileName").live('keypress', function(event) {
				console.log(event);
				if(!(event.which == 13)) {
					return true;
				} else {
					createFile($('#newFileName').html());
					event.preventDefault();
					return false;
				}
			});

			$("#addNewFile").live("click", function(event) {
				event.preventDefault();
				if($('#newFileName i').length > 0) {
					$('#newFileName').html("");
					$('#newFileName').focus();
				} else {
					createFile($('#newFileName').html());
				}
				return false;
			})

			//handle ctrl+s

			$("#input").live('keypress',function(event) {
				//console.log(event);
				if(!(event.which == 115 && event.ctrlKey) && !(event.which == 19)) {
					return true;
				} else {
					save();
					event.preventDefault();
					return false;
				}
			});
		}
		/*
		* Path is used for autoloading purpose
		*/
		function load(askedPath) {
			document.getElementById('input').textContent=null;
			var login = $("#login").val();
			var pass = $("#pass").val();
			var path = encodeURIComponent($("#inputs-navs li.active a.file").html());
	
			if(typeof path == "undefined") {
				console.log("aborting, cause: nothing to load")
			}
			var key = CryptoJS.SHA1(login + pass).toString();
			var url = "load";
			console.log(path)
			var data = {
				login: encodeURIComponent(login),
				key: encodeURIComponent(key),
				path: path,
			}
			console.log("loading on" + url)
			$.ajax({
				url: url,
				type: 'POST',
				data: data
			}).done(function(data) {
				dispatch(data);
			})
		}

		
		/*
		 * Method to save the note on the current path on the server

		 */

		function save() {
			var input = document.getElementById('input').innerHTML;
			var login = $("#login").val();
			var pass = $("#pass").val();
			var path = $("#input").data('path');
			console.log("saving:", path);
			//TODO check if this bug is gone!!!
			if(!path){
				console.log("abort, cause: no path");
				return;
			}
			
			//prevent useless save on the welcome page
			if(login == "" || pass == "") {
				console.log("abort")
				return false;
			}
			var content = CryptoJS.AES.encrypt(input, pass).toString();
			var key = CryptoJS.SHA1(login + pass).toString();

			var url = "/save";
			var data = {
				login: encodeURIComponent(login),
				key: encodeURIComponent(key),
				path: path,
				content: content
			}
			console.log("saving on" + url)
			$.ajax({
				url: url,
				type: 'POST',
				data: data
			}).done(function(data) {
				dispatch(data);
			})

		}

		function createFile(path) {
			//setting the path to display
			this.nextPath=encodeURIComponent(path);
			console.log("creating new file: " + path);
			$("#newFileName").html("<i>New Note</i>")
			var input = $("#input").html();
			var login = $("#login").val();
			var pass = $("#pass").val();
			var key = CryptoJS.SHA1(login + pass).toString();

			var url = "/createFile";
			var data = {
				login: encodeURIComponent(login),
				key: encodeURIComponent(key),
				path: encodeURIComponent(path),
			}
			$.ajax({
				url: url,
				type: 'POST',
				data: data
			}).done(function(data) {
				dispatch(data);
			})

		}


		function deleteFile() {
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
			$.ajax({
				url: url,
				type: 'POST',
				data: data
			}).done(function(data) {
				dispatch(data);
			})

		}


		/*
		 * This method is called on user connection
		 * If the user don't exist and the username is free, then the new user will have the possibility to create a new account
		 */

		function checkUser() {
			console.log("checking user");
			$("#input").hide();
			var login = $("#login").val();
			var pass = $("#pass").val();
			//prevent useless save on the welcome page
			if(login == "" || pass == "") {
				console.log("abort")
				return false;
			}
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

		function createUser() {
			console.log("creating user");
			var login = $("#login").val();
			var pass = $("#pass").val();
			//prevent useless save on the welcome page
			if(login == "" || pass == "") {
				console.log("abort")
				return false;
			}
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
		function displayContent(response) {
			if(response) {
				console.log("displaying",response)
				$("#input").data('path',response.path);
				console.log("displaying: " + response.path);
				var source = response.content
				var pass = $("#pass").val();
				var raw = CryptoJS.AES.decrypt(source, pass);
				$("#input").show();
				var result = CryptoJS.enc.Utf8.stringify(raw);
				var input=document.getElementById('input');
				input.innerHTML=result.toString();
				console.log("Loaded");
				$("#input").focus()
			}
		}
		/*
		 *load or reload the tabs
		 */

		function initUserInterface(tabs) {
			console.log("init User Interface",tabs)
			$("#inputs-navs").html("");
			$("#commands").show();
			var nav;
			var tab;
			var empty = true;
			for(var i = 0; i < tabs.length; i++) {
				var nav = $('<li>').html('<a class="file" href="#" data-toggle="tab">' + decodeURIComponent(tabs[i]) + '</a>')
				if(this.nextPath == decodeURIComponent(tabs[i])) {
					$(nav).addClass("active");
					empty = false;
				}
				$("#inputs-navs").append(nav);
			};
			//Autoload 
			if(!empty && this.nextPath){
			var path=this.nextPath;
			this.nextPath=null;
			load(path)
		}
		}
		/*
		*Event originated from a server response
		*/
		function dispatch(response) {
			console.log("dispatcher: ",response);
			if(response.status == "userDontExist") {
				var create = window.confirm("This account does not exist, do you want to create it?")
				if(create) {
					createUser()
				}
			}
			if(response.status == "userExist") {
				console.log("User Exist");
				initUserInterface(response.paths);
			}
			if(response.status == "fileCreated") {
				console.log("File successfully created");
				checkUser();
			}
			if(response.status == "fileAlreadyExist") {
				window.alert("This File name is already taken");
			}
			if(response.status == "userCreated") {
				//saving the new content on user created 
				console.log("userCreated");
				checkUser();
			}
			if(response.status == "pathDontExist") {
				console.log(response);			
			}
			if(response.status == "loaded") {
				displayContent(response)
			}
			if(response.status == "invalidPassword") {
				$("#commands").hide();
				window.alert("Invalid Password")
			}
			if(response.status == "invalidFileName") {
				window.alert("Invalid FileName");
				$('#newFileName').html('<i>New Note</i>')
				
			}
			if(response.status == "fileDeleted") {
				$("#input").data('path',null);
				checkUser();
			}


		}

		return this;

	}(jQuery, CryptoJS)