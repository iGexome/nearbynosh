var fs = require('fs'),
    path = require('path'),
    http = require('http'),
    url = require('url');

var winston = require('winston'),
	_ = require('underscore'),
    connect = require('connect');

var Data = require('./data');

process.on('uncaughtException', function(err) {
    winston.info('error', 'Uncaught exception: ' + err);
});

var config, overrideConfig, datasource;

try {
	config = fs.readFileSync(path.join(__dirname, "../config.json"), "utf8");

	try {
		config = JSON.parse(config);
	} catch (ignored) {
        winston.info('Config file contains invalid JSON');
	}
} catch (e) {
    winston.info('Unable to find configuration file, exiting...');
	process.exit(1);
}

try {
	overrideConfig = fs.readFileSync(path.join(__dirname, "../overrides.json"), "utf8");

	try {
		overrideConfig = JSON.parse(overrideConfig);
		config = _.extend(config, overrideConfig);
	} catch (ignored) {
        winston.info('Override file contains invalid JSON');
	} 
} catch (e) {
    winston.info('No override file found');
}

_.each(config, function(v, k) {
    if (process.env[k]) {
        config[k] = process.env[k];
    }
});

if (config.logFile) {
//
//    winston.loggers.add('default', {
//        console: {
//            colorize: true,
//            timestamp: true
//        },
//        file: {
//            filename: path.resolve(__dirname, '../' + config.logFile)
//        }
//    });
//
//    var fileTransport = new winston.transports.File({filename: path.resolve(__dirname, '../logs/exceptions.log'), timestamp: true});
//    winston.loggers.get("default").handleExceptions(fileTransport);

    winston.add(winston.transports.File, { filename: path.join(__dirname, "../" + config.logFile) });
    winston.remove(winston.transports.Console);
}

process.on('end', function() {
	console.log('cleanup');
	datasource.cleanup();
});

var startServer = module.exports.startServer = function () {
//	datasource = new Data({datasource: config.datasource, memcached_server: config.memcached_server});
    datasource = new Data({datasource: path.join(__dirname, '../' + config.datasource), memcached_server: config.memcached_server});

    datasource.on('dataReady', function() {
        winston.info('Ready to accept lat/long queries');
    });

    datasource.loadData({local: true});

    var app = connect()
        .use(connect.compress())
        .use(connect.query())
        .use(connect.static(path.join(__dirname, "../html")))
        .use('/query', function(request, response) {
            response.setHeader('content-type', 'application/json');

            datasource.on('queryComplete', function(data) {
                response.end([request.query.callback, '(', JSON.stringify(data), ')'].join(''));
                datasource.removeAllListeners('queryComplete');
            });

            datasource.query({longitude: request.query.longitude, latitude: request.query.latitude});
        });

    if (!config.port) {
        throw "No port defined";
    }

    http.createServer(app).listen(config.port);

    winston.info("Nosh server started on http://127.0.0.1:" + config.port);
};
