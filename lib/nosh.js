var fs = require('fs'),
    path = require('path'),
    http = require('http');

var log = require('winston'),
	_ = require('underscore');

var Data = require('./data');

process.on('uncaughtException', function(err) {
	log.info('error', 'Uncaught exception: ' + err);
});

var config, overrideConfig;

try {
	config = fs.readFileSync(path.join(__dirname, "../config.json"), "utf8");

	try {
		config = JSON.parse(config);
	} catch (ignored) {
		log.info('Config file contains invalid JSON');
	}
} catch (e) {
	log.info('Unable to find configuration file, exiting...');
	process.exit(1);
}

//todo: support env config

try {
	overrideConfig = fs.readFileSync(path.join(__dirname, "../overrides.json"), "utf8");

	try {
		overrideConfig = JSON.parse(data);
		config = _.extend(config, overridesConfig);
	} catch (ignored) {
		log.info('Override file contains invalid JSON');
	} 
} catch (e) {
	log.info('No override file found');
}

if (config.logFile) {
	log.add(winston.transports.File, { filename: path.join(__dirname, "../" + config.logFile) });
	log.remove(winston.transports.Console);
}

process.on('end', function() {
	console.log('cleanup');
	datasource.cleanup();
});

var startServer = module.exports.startServer = function () {
	var datasource = new Data({datasource: config.datasource, memcached_server: config.memcached_server});

	var server = http.createServer(function(request, response) {		
		var queryData = url.parse(request.url, true).query;
		response.setHeader('content-type', 'application/json');

		if ((request.url).indexOf("/query") === 0) {		
			datasource.query({longitude: queryData.longitude, latitude: queryData.latitude});
			datasource.on('complete', function(data) {
				response.end(JSON.stringify(data));
			});

			return;
		}

		response.end(JSON.stringify({'echo': 'Welcome to Nosh!'}));
	});

	if (!config.port) {
		throw "No port defined";
	}

	server.listen(config.port);

	log.info("Nosh server started on http://127.0.0.1:" + config.port);
};
