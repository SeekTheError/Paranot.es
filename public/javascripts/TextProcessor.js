TextProcessor = (function() {

	TextProcessor = {}

	TextProcessor.cursor = null;

	//fuction performed on the input
	//Must return a STRING
	//First function get the inoput
	var onInputFunctions = [

	function getContentAndPreventError() {
		//handle the case where there is no div at the beggining(after full removal of the text eg)
		var html = document.getElementById("input").innerHTML;
		looseStart = html.split("<")[0]
		if(looseStart != "") {
			var restoredId="";
			//prevent client desync
			if(TextProcessor.cursor && pn.currentPath == TextProcessor.cursor.path){
				var restoredID=TextProcessor.cursor.id;
			}

			document.getElementById("input").innerHTML = html.replace(looseStart, "<div id='"+restoredID+"' >" + looseStart + "</div>");
		
		}

		content = $("#input > div");
		return content;
	}, function AffectUUIDS(divs) {
		var out = [];
		var missingIds = 0;
		var id = ""
		//in my version of webkit, the id of the div in the content editable was duplicated
		var previousUUIDS = [];
		for(var i = 0; i < divs.length; i++) {
			id = divs[i].id
			if(id == "" || id == "undefined" || $.inArray(id, previousUUIDS) != -1) {
				divs[i].id = pn.ExposedStore.UUIDS.pop();
			}
			previousUUIDS.push(divs[i].id);
		};
		return divs;
	}, function convertToJson(divs) {
		var tmp = {};
		for(var i = 0; i < divs.length; i++) {
			tmp[i] = {
				index: i,
				id: divs[i].id,
				content: divs[i].innerHTML
			}
		};
		return JSON.stringify(tmp);
	}

	]

	//fuction performed on the Output
	//Must Return a STRING
	var onOutputFunctions = [

	function loadOrUpdate(content) {
		var js=null;
		try {
			js = JSON.parse(content);
		} catch(error) {
			return content;
		}
		if(js.length>0 ){

		}
		//display the content in a regular way;
		if(!pn.ExposedStore.modeReload) {
			if(js.length>0 ){
				
			}
			var html = "";
			for(var i in js) {
				if(i == 0){
					TextProcessor.cursor={path:pn.currentPath,id:js[i].id}
					}
				html += '<div id="' + js[i].id + '">' + js[i].content + '</div>';
			};
			console.log(js);
			document.getElementById("input").innerHTML = html;
		}
		//update the modified divs
		else {
			pn.ExposedStore.modeReload = false;
			console.log("reloading");
			var toUpdate=null;
			var newBlockIncrement=0;
			var currentDivs=$("#input > div")
			for(var i in currentDivs) {
				for(var j in js) {
					if(js[j].id == currentDivs[i].id )
						currentDivs[i]=false
				}
			}
			//if a existing div is impossible to find, divs is impossible to find,
			//remove it(TODO > execpt if we are working on it)
			for (var i in currentDivs){

				//protect the Cursor(the first div, not the carret :) )
				if(i != 0)
				$("#"+currentDivs[i].id).remove();
			}

			for(var i in js) {
				if(toUpdate=document.getElementById(js[i].id)){
					toUpdate.innerHTML=js[i].content;
				}else {
				//on new divs
				$($("#input > div")[js[i].index-1]).after(
					$('<div id="' + js[i].id + '">' + js[i].content + '</div>'));	

				}
				//html += '<div id="' + js[i].id + '">' + js[i].content + '</div>';
			};
		}



	}]

	TextProcessor.getInput = function() {
			var result = performOnInput();
			if(typeof result !== "string") {
				throw new Error("TextProcessorError", "function get Input must return Text of type string, check the Input proccessors chain");
			}
			return result;
		}

	TextProcessor.setOutput = function(rawOutput) {


		if(typeof rawOutput !== "string") {
			throw new Error("TextProcessorError", "function set Output must get Text of type string as param");
		}
		performOnOutput(rawOutput);

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