var http = require('http'),
    events = require('events'),
    util = require('util'),
    crypto = require('crypto'),
    fs = require('fs');

var _ = require('underscore'),
//    memjs = require('memjs'),
    geolib = require('geolib');

var Data = function(options) {
    events.EventEmitter.call(this);

    var self = this;
    options = options || {};

    self.datasource = options.datasource;
//    self.memcachedClient = memjs.Client.create();
    self.memcachedLifetime = 60 * 60;

    self.query = function(queryOpts) {
        queryOpts = queryOpts || {};

        var data;

        if (self.memcachedClient) {
            var key = self._getKey(queryOpts);
            self.memcachedClient.get(key, function(err, response) {
                if (err) {
                    console.log("Unable to get. Reason: " + err);
                }

                if (!response) {
                    data = self._locate(queryOpts);
                } else {
                    response = JSON.stringify(response);
                    data = response[key];
                }

                self.emit('queryComplete', data);
            });
        } else {
            data = self._locate(queryOpts);
            self.emit('queryComplete', data);
        }
    };

    self._locate = function(latLong) {
        var foundTrucks = _.filter(self._allLocations, function(truckLocation) {
            if (truckLocation.latitude && truckLocation.longitude) {
                return geolib.isPointInCircle(truckLocation, latLong, 500);
            }
        });

        var foodTrucks = [];
        _.each(self._dataset, function(foodTruck) {
            _.each(foundTrucks, function(foundTruckLoc) {
                if (foodTruck.location.latitude == foundTruckLoc.latitude &&
                    foodTruck.location.longitude == foundTruckLoc.longitude) {
                    foodTrucks.push(foodTruck);
                }
            });
        });

        if (self.memcachedClient && foodTrucks.length > 0) {
            var key = self._getKey(latLong);
            self.memcachedClient.set(key, foodTrucks, self.memcachedLifetime);
        }

        return foodTrucks;
    },

    self._getKey = function(str) {
        if (typeof str == 'object') {
            str = JSON.stringify(str);
        }

        var md5sum = crypto.createHash('md5');
        md5sum.update(str);
        return md5sum.digest('hex');
    },

    self.cleanup = function() {
//        self.memcachedClient.end();
    };

    self._parseData = function(rawData) {
        var self = this;
        self._dataset = {};
        self._allLocations = [];

        var id = 0;

        _.each(rawData, function(v) {
            self._allLocations.push({
                latitude: v.latitude,
                longitude: v.longitude
            });

            self._dataset[id] = {
                name: v.applicant,
                description: v.fooditems,
                location: {
                    latitude: v.latitude,
                    longitude: v.longitude
                }
            };

            id++;
        });
    };

    self.loadData = function(opts) {
        options = opts || {};

        if (options.local) {
            var c = fs.readFileSync(self.datasource, "utf8");
            self._rawData = JSON.parse(c);
            self._parseData(self._rawData);
            self.emit('dataReady');
        } else {
            http.get(self.datasource, function(response) {
                var c = "";

                response.on('data', function(chunk) {
                    c += chunk;
                });

                response.on('end', function() {
                    self._rawData = JSON.parse(c);
                    self._parseData(self._rawData);

                    self.emit('dataReady');
                });
            }).on('error', function(e) {
                console.log('error: ' + e)
            });
        }
    };
};

util.inherits(Data, events.EventEmitter);
module.exports = Data;