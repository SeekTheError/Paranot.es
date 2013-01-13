TextProcessor = (function() {

	TextProcessor = {}


	//fuction performed on the input
	//Must return a STRING
	//First function get the inoput
	var onInputFunctions = [

	function getContent() {
		//handle the case where there is no div at the beggining(after full removal of the text eg)
		var html=document.getElementById("input").innerHTML;
		looseStart=html.split("<")[0]
		if(looseStart != ""){
			document.getElementById("input").innerHTML=html.replace(looseStart,"<div>"+looseStart+"</div>");
		}

		content = $("#input > div");
		return content;
	}, function divise(divs) {
		var out = [];
		var missingIds=0;
		for (var i = 0; i < divs.length; i++) {
			if(divs[i].id== ""){
				missingIds++;
			}
			console.log(divs[i].innerHTML);
			out.push(divs[i].innerHTML);
		
		};

		$.ajax({ url :"http://"+window.location.host+"/UUID/"+missingIds,dataType:"json" }).success(function(data){


			console.log(data)

		})
		for (var i = 0; i < divs.length; i++) {
			if(divs[i].id== ""){
				missingIds++;
			}
			console.log(divs[i].innerHTML);
			out.push(divs[i].innerHTML);
		
		};


		console.log("TextProcessor: ",out);
		return out;
	},function toJson(input){
		var tmp={};
		for (var i = 0; i < input.length; i++) {
			tmp[i]={index:i,content:input[i]}
		};
		console.log(tmp);
		return JSON.stringify(tmp);
	}

	]

	//fuction performed on the Output
	//Must Return a STRING
	var onOutputFunctions = [
	  function divise(content) {
	  	var html="";
	  	console.log(content);
	  	try {
		js=JSON.parse(content);
		}catch(error){
			return content;
		}
		TEST=js;
		
		for (var i in js) {
			html+='<div>'+js[i].content+'</div>';
		};
		
		console.log(js);
		return html;
	}]

	TextProcessor.getInput = function() {
			var result = performOnInput();
			if(typeof result !== "string") {
				throw new Error("TextProcessorError", "function get Input must return Text of type string, check the Input proccessors chain");
			}
			return result;
		}

	TextProcessor.getOutput = function(rawOutput) {
		var result = performOnOutput(rawOutput);

		if(typeof result !== "string") {
			throw new Error("TextProcessorError", "function get Output must return Text of type string, check the Output proccessors chain");
		}
		return result;
	}

	function performOnInput() {
		var pipe;
		for(var i = 0; i < onInputFunctions.length; i++) {
			pipe = onInputFunctions[i](pipe);
		};

		return pipe;
	}

	function performOnOutput(rawOutput) {
		var pipe = rawOutput;
		for(var i = 0; i < onOutputFunctions.length; i++) {
			pipe = onOutputFunctions[i](pipe);
		};
		return pipe;
	}
	return TextProcessor;
})()