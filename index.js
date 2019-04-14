#!/usr/bin/node

//modules declaration
var spawner = require('child_process')
var StringDecoder = require('string_decoder').StringDecoder
var events = require('events')
var fs = require('fs')
var schedule = require('node-schedule')
var omx = require('node-mplayer')


//clean up
process.on('SIGHUP',  function(){ console.log('\nCLOSING: [SIGHUP]'); process.emit("SIGINT"); })
process.on('SIGINT',  function(){
	 console.log('\nCLOSING: [SIGINT]');
	 for (var i = 0; i < pids.length; i++) {
		console.log("KILLING: " + pids[i])
		process.kill(-pids[i])
 	}
	 process.exit(0);
 })
process.on('SIGQUIT', function(){ console.log('\nCLOSING: [SIGQUIT]'); process.emit("SIGINT"); })
process.on('SIGABRT', function(){ console.log('\nCLOSING: [SIGABRT]'); process.emit("SIGINT"); })
process.on('SIGTERM', function(){ console.log('\nCLOSING: [SIGTERM]'); process.emit("SIGINT"); })

var pids = new Array();

function cleanPID(pid) {
	var pid = pid || false
	for (var i = 0; i < pids.length; i++) {
		if ( pids[i] == pid ) {
			pids.splice(i, 1)




			// console.log("PID"+pid+" deleted")





		}
	}
}


var assets = new Array();

assets = fs.readdirSync('assets')

// fs.readdir('./assets', function(err, items) {
//
//     for (var i=0; i<items.length; i++) {
// 			assets.push(items[i])
//     }
//
// 		for (var i=0; i<assets.length; i++) {
			// console.log(assets[i]);
// 			fs.stat(assets[i], function(err, stats) {
// 				// console.log(stats);
// 			});
// 		}
//
// });

console.log(assets);

function handleButtons(tty, button_array) {

	console.log(button_array)
	var sum = 0
	var combo = ""
	for (var i = 0; i < button_array.length; i++) {
		if ( button_array[i] == 0 )
		{
			combo += i
			sum += 1
		}
	}
	if ( sum == 1)
	{
		setupPlayer(ttys[tty], "./assets/"+assets[combo])
	}
	else if ( sum == 0)
	{
 		return false
	}
	else
	{
		console.log("special move")
	}

}


function buttonPressed(button, now) {
	var button = button || false
	if ( ! button || lock == true ) return false
	var now = now || Date.now()
	if ( now - buttons_pressed["button1"] > 1000 && now - buttons_pressed[button] > 500 )
		{
			buttons_pressed[button] = now
			console.log(button + ": pressed")
			if (button == "button1") {
				console.log("changeButton")
				changeAsset()
			}
			else if (button == "button0" && current_volume > -4500) {
				console.log("volumeDownButton")
				volume("down")
			}
			else if (button == "button2" && current_volume < 0) {
				console.log("volumeUpButton")
				volume("up")
			}
		}

}

var current_volume = -4200

function volume(dir) {
	var dir = dir || false

	if ( ! dir ) return false

	if( ! player["player"] || ! player["player"].open == true ) return false

	else if ( dir == "up" ) player["player"].volUp()
	else if ( dir == "down" ) player["player"].volDown()
}

var current_asset = 0
var lock = false
var default_volume=100


function setupPlayer(tty, asset) {

	var asset = asset
	var tty = tty || false
	if ( asset === false ) return false

	if ( tty["player"] && tty["player"]["player"].open == true )
	{

		tty["player"]["player"].quit()

	}

	asset = asset
	var exists = fs.existsSync(asset);
	if ( ! exists ) {
		console.log(asset + " doesn't exist");
		return false
	}
	else {
		console.log(asset + " exists")
		var player = {
		"player": omx(asset, tty["volume"]),
		"volume": 0
		}
	}

	tty["player"] = player
	var pid = player["player"].pid
	pids.push(pid)
	console.log(player["player"].pid)

	if ( player["player"].process ) {

		player["player"].process.stdout.on('data', (data) => {
			var decoder = new StringDecoder('utf-8')
			var string = decoder.write(data)
			string=string.split(/\r?\n/)
			for( var i = 0; i < string.length; i++) {

				if (string[i].length > 0 && string[i].match(/Volume:/) )
				{

					var vol = escape(string[i])
					vol = vol.replace(/^.*5B(K*)(Volume)/, "$2")
					vol = unescape(vol)
					vol = vol.replace(/\r?\n/g,"")
					vol = vol.replace(/Volume: (.*?) *%/i,"$1")
					player["player"]["volume"] = vol
					tty["volume"] = vol
					console.log("Current volume: " + player["player"]["volume"] + "%")

				}

				else if (string[i].length > 0 && string[i].match(/Selected audio co/) )
				{
					setTimeout(function(){
						lock = false
					}, 2000);
					console.log("player started playing")
				}

				else if (string[i].length > 0 && string[i].match(/.*5B(K*)/))console.log(string[i])
				// else console.log(string[i])
			}
		});

		player["player"].process.stderr.on('data', (data) => {
			// var decoder = new StringDecoder('utf-8')
			// var string = decoder.write(data)
			// string=string.split(/\r?\n/)
			// for( var i = 0; i < string.length; i++) {
			//  if (string[i].length > 0 )	console.log(string[i])
			// }
		});

	}

	player["player"].on('close', function(pid) {
		lock = false
		console.log("playback ended")
		cleanPID(pid)
	}.bind(null, pid))

}

function cycleAssets() {
		current_asset++
		current_asset = current_asset % assets.length
		return current_asset

}

function changeAsset() {
		if ( lock == true ) {
			console.log("player locked")
			return false
		}
		console.log("changeAsset")
		var asset = cycleAssets()
		lock = true
		if( player["player"] && player["player"].open == true ) player["player"].quit()
		else setupHandler(asset)

}

function setupHandler(asset) {
	lock = true
	if ( connection_check() == 1 ) {
		console.log("no internet connection. waiting.")
		setTimeout(function(asset) {
			setupHandler(asset)
		}.bind(null,asset), 500)
	}
	else {
		console.log("internet connection. playing.")
		setupPlayer(asset)
	}
}

// changeAsset()

//python buttons
// function py() {
// 	var py = spawner.spawn("bash", new Array("-c", "./buttons.py"), {detached: true})
// 	var decoder = new StringDecoder('utf-8')
//
// 	pids.push(py["pid"])
//
// 	py.stdout.on('data', (data) => {
// 	  var string = decoder.write(data)
// 		string=string.split(/\r?\n/)
// 		for( var i = 0; i < string.length; i++) {
// 			if ( string[i].length > 0 && string[i].match(/^system:connected/) ) {
// 				console.log("reading buttons")
// 			}
// 			else if ( string[i].length > 0 && string[i].match(/^system:buttons:/) ) {
// 				console.log("buttons connected: " + string[i].replace(/^system:buttons:/, ""))
// 			}
// 			else if ( string[i].length > 0 && string[i].match(/^buttons:/) ) {
// 				// console.log(string[i])
// 				var combination = string[i].replace(/^buttons:/, "").split(":")
// 				var button0 = combination[0]
// 				var button1 = combination[1]
// 				var button2 = combination[2]
// 				var now = Date.now()
// 				// console.log("__________________")
// 				if ( button0 == 1 ) buttonPressed("button0", now)
// 				if ( button1 == 1 ) buttonPressed("button1", now)
// 				if ( button2 == 1 ) buttonPressed("button2", now)
//
// 			}
// 		}
// 	});
// 	//not final state!
// 	py.stderr.on('data', (data) => {
// 	  // console.log(`stderr: ${data}`)
// 	  // var string = decoder.write(data)
// 		// string = string.replace(/\r?\n$/, "")
// 		// if ( string.match(/^ls: cannot access/)) console.log(search + " not found")
// 		// return false
// 	});
// 	py.on('close', function (pid, code) {
// 		cleanPID(pid)
// 		if (code == 0) {
// 			for ( i in ttys ) {
// 				if ( ! ttys[i]["catstarted"] ) {
// 					console.log(ttys[i])
// 					cat(ttys[i])
// 				}
// 				else "nothing to cat"
// 			}
// 		}
// 		else {
// 			console.log(' not to be found')
// 		}
// 	}.bind(null, py["pid"]));
// 	return py;
// }
//
// py();


var ttys = new Array();

//ls ttys
function ls(search) {
	var search=search || false
	var ls = spawner.spawn("bash", new Array("-c", "ls " + search), {detached: true})
	var decoder = new StringDecoder('utf-8')

	pids.push(ls["pid"])

	ls.stdout.on('data', (data) => {
	  var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			if ( string[i].length > 0 && typeof ttys[string[i]] === "undefined") {
				var tty = {
					"tty":string[i],
					"confirmed":false,
					"position":i,
					"catstarted":false,
					"volume":default_volume
				}
				ttys[string[i]] = tty
			}
		}
	});
	//not final state!
	ls.stderr.on('data', (data) => {
	  // console.log(`stderr: ${data}`)
	  // var string = decoder.write(data)
		// string = string.replace(/\r?\n$/, "")
		// if ( string.match(/^ls: cannot access/)) console.log(search + " not found")
		// return false
	});

	ls.on('close', function (pid, code) {
		cleanPID(pid)
		if (code == 0) {
			for ( i in ttys ) {
				if ( ! ttys[i]["catstarted"] ) {
					console.log(ttys[i])
					cat(ttys[i])
				}
				else "nothing to cat"
			}
		}
		else {
			console.log(search + ' not to be found')
		}
	}.bind(null, ls["pid"]));
	return ls;
}


//cat ttys
function cat(tty) {
	var tty = tty || false
	if ( ! tty ) return false

	tty["catstarted"] = true

	var decoder = new StringDecoder('utf8')

	var tty_setup = spawner.spawn("bash", new Array("./ttySetup.sh", tty["tty"]), {detached: true})
	pids.push(tty_setup["pid"])
	tty_setup.on('close', function(pid){
		cleanPID(pid)
	}.bind(null, tty_setup["pid"]))

	var tty_cat = spawner.spawn("bash", new Array("./ttyCat.sh", tty["tty"]), {detached: true})
	pids.push(tty_cat["pid"])

	var tty_ready
	//periodical checking until the device respondes
	function echoReady() {

		 tty_ready = spawner.spawn("bash", new Array("./ttyEcho.sh", tty["tty"], "system:ready"), {detached: true})

		 console.log(tty["tty"] + " was sent 'system:ready'")

		 pids.push(tty_ready["pid"])

		 tty_ready.on('close', function(pid){
			 cleanPID(pid)
		 }.bind(null, tty_ready["pid"]))
	}
	echoReady()
	var echo_ready = setInterval(function(){
		echoReady()
	}, 5000)

	tty_cat.stdout.on('data', (data) => {
		var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			if ( string[i].length > 0 && string[i].match(/^system:connected/) && ! tty["confirmed"])
			{
				tty["confirmed"] = true
				console.log(tty)
				clearInterval(echo_ready)
				console.log(tty["tty"] + " is connected")
			}

			else	if ( string[i].length > 0 && string[i].match(/^system:stillconnected/) && ! tty["confirmed"])
			{
				var tty_echo = spawner.spawn("bash", new Array("./ttyEcho.sh", tty["tty"], "system:alert:reset"), {detached: true})
				console.log(tty["tty"] + " was sent RESET")

			}

			else	if ( string[i].length > 0 && string[i].match(/^buttons:/) && tty["confirmed"])
			{

				var buttons = string[i].replace(/buttons:/, "")
				var button_array = buttons.split("")
				handleButtons(tty["tty"], button_array)


			}

			else	if ( string[i].length > 0 && string[i].match(/^shut:down/) && tty["confirmed"])
			{
				var volume = string[i].replace(/shut:/, "")
				if ( tty["player"] && tty["player"]["player"].open == true) {

					console.log("shut:down")
					tty["player"]["player"].quit()

				}
			}


			else	if ( string[i].length > 0 && string[i].match(/^volume:/) && tty["confirmed"])
			{

				var volume = string[i].replace(/volume:/, "")

				if ( tty["player"] && tty["player"]["player"].open == true) {

					if ( volume == "down") tty["player"]["player"].volDown()
					else if ( volume == "up") tty["player"]["player"].volUp()

				}

			}

			else if ( string[i].length > 0 ) console.log("NON SYSTEMATIC: "+string[i]);
		// console.log(output)
	}

	})

	tty_cat.stderr.on('data', (data) => {
	  // console.log(`stderr: ${data}`)
	})

	tty_cat.on('close', function (pid, code) {
			cleanPID(pid)
			if ( echo_ready )	clearInterval(echo_ready)
			console.log(tty["tty"] + " was disconnected. killing dimmer on this node.")
			delete ttys[tty["tty"]]
		}.bind(null, tty_cat["pid"]))
		// console.log("kill ttys")
	return tty_cat;
}




setInterval(function(){
	ls("/dev/ttyA*")
}, 3000)






function numberPad(number, padding) {

	function recursePad(number, pad) {
		var pow = Math.pow(10, pad)
		if ( number >= pow ) {
			return pad
		}
		else return recursePad(number, pad-1)
	}

	var number = number
	var padding = padding-1
	var pads = recursePad(number, padding)
	var zeros = "0"
	zeros = zeros.repeat(padding-pads)
	return String(zeros + number)
}

function connection_check() {
	return spawner.spawnSync('bash', ['-c', './connection_check.sh']).status
}
