var encrypted = CryptoJS.AES.encrypt("Message", "Secret Passphrase");
s=encrypted.toString()
//console.log(s);
var decrypted = CryptoJS.AES.decrypt(s, "Secret Passphrase");
r=CryptoJS.enc.Utf8.stringify(decrypted);
//console.log(r);


/**
* login : the user login
  pass : the user pass, used for aes encryption
  path : the path of the file
  key : the sha1 of login+pass, used as an index in the local store
*/
var pn = function($,CryptoJS){
Store = [];
if (!$ || !CryptoJS){
	console.error("Missing Dependencies");
}

	this.init = function(){
		$("#login,#pass,#path").change(function(){
		load()
		});
		$("#input").change(function(){
			save();
		});
	}
//TODO use login+key as sha1 to avoid transmission of the encrypted key and thirdpart overidding
function load(){
	console.log("loading");
	$("#input").val("");
	var login=$("#login").val();
	var pass=$("#pass").val();
	var path=$("#path").val();
	var key=CryptoJS.SHA1(login+pass).toString();
	if(Store[key]&&Store[key][path]){
	var source=Store[key][path];
}
	if(source){
		var raw=CryptoJS.AES.decrypt(source,pass);
		var result=CryptoJS.enc.Utf8.stringify(raw);
		$("#input").val(result.toString());
		console.log("Loaded");
	}
}

function save(){
	console.log("saving")
	var input=$("#input").val();
	var login=$("#login").val();
	var pass=$("#pass").val();
	var path=$("#path").val();
	var result=CryptoJS.AES.encrypt(input,pass).toString();
	var key=CryptoJS.SHA1(login+pass).toString();
	if(!Store[key]){
		Store[key]=[];
	}
	Store[key][path]=result
	console.log("Saved");
	console.log(Store);
}


	return this;

}(jQuery,CryptoJS)

