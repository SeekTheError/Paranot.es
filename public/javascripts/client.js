var encrypted = CryptoJS.AES.encrypt("Message", "Secret Passphrase");
s=encrypted.toString()
//console.log(s);
var decrypted = CryptoJS.AES.decrypt(s, "Secret Passphrase");
r=CryptoJS.enc.Utf8.stringify(decrypted);
//console.log(r);

var pn = pn?pn:function($,CryptoJS){
Store = [];
if (!$ || !CryptoJS){
	console.error("Missing Dependencies");
}

	this.init = function(){
		$("#key").change(function(){
		load()
		});
		$("#input").change(function(){
			
			save();
		});
	}

function load(){
	console.log("loading");
	$("#input").val("");
	var key=$("#key").val();
	var ekey=CryptoJS.SHA1(key).toString();
	var login=$("#login").val();
	if(Store[login]&&Store[login][ekey]){
	var source=Store[login][ekey];
}
	if(source){
		var raw=CryptoJS.AES.decrypt(source, $("#key").val());
		var result=CryptoJS.enc.Utf8.stringify(raw);
		$("#input").val(result.toString());
		console.log("Loaded");
	}
}

function save(){
	console.log("saving")
	var input=$("#input").val();
	var key=$("#key").val();
	var login=$("#login").val();
	var result=CryptoJS.AES.encrypt(input,key).toString();
	var sha=CryptoJS.SHA1(key).toString();
	if(!Store[login]){
		Store[login]=[];
	}
	Store[login][sha]=result
	console.log("Saved");
	console.log(Store);
}


	return this;

}(jQuery,CryptoJS)

