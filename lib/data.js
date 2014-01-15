var http = require('http'),
	events = require('events'),
	util = require('util'),
	querystring = require('querystring'),
	crypto = require('crypto');

var Memcached = require('memcached');

var Data = function(options) {
	events.EventEmitter.call(this);

	var self = this;
	options = options || {};	

	self.datasource = options.datasource;
	self.memcached = new Memcached("127.0.0.1:11211");
	self.memcachedLifetime = 60 * 60; // 1 hour

	self.query = function(queryOpts) {
		queryOpts = queryOpts || {};

		var req = [self.datasource, '?', querystring.stringify(queryOpts)].join('');
		var key = self._getKey(req);

		self.memcached.gets(key, function(err, data) {

			if (err || !data) {
				console.log("Unable to get. Reason: " + err);
				self._queryRemote(req);
				return;
			}

			self.emit('complete', JSON.parse(data));
		});		
	};

	self._getKey = function(str) {
		var md5sum = crypto.createHash('md5');		
		md5sum.update(str);
		return md5sum.digest('hex');
	},

	self._queryRemote = function(req) {
		var self = this;
		console.log("GET: " + req);

		http.get(req, function(response) {
			var c = "";

			response.on('data', function(chunk) {
				c += chunk;
			});

			response.on('end', function() {
				var key = self._getKey(req);
				var value = JSON.parse(c);

				self.memcached.set(key, value, self.memcachedLifetime, function(err) {
					console.log("Unable to persist. Reason: " + err);
				});

				self.emit('complete', value);
			});
		}).on('error', function(e) {
			console.log('error: ' + e)
		});
	},

	self.cleanup = function() {
		memcached.end();
	};
};

util.inherits(Data, events.EventEmitter);
module.exports = Data;