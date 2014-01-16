var Data = require('../lib/data');
var path = require('path');

//var datasource = new Data({datasource: 'http://data.sfgov.org/resource/rqzj-sfat.json', memcached_server:'127.0.0.1:11211'});
var datasource = new Data({datasource: path.join(__dirname, "../dataset/rqzj-sfat.json"), memcached_server:'127.0.0.1:11211'});

datasource.on('queryComplete', function(response) {
    console.log('complete: ' + JSON.stringify(response));
});

datasource.on('dataReady', function() {
    datasource.query({latitude: 37.7901490874965, longitude: -122.398658184594});
});

datasource.loadData({local: true});
