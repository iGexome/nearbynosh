var Data = require('../lib/data');
var datasource = new Data({datasource: 'http://data.sfgov.org/resource/rqzj-sfat.json', memcached_server:'127.0.0.1:11211'});

datasource.query({latitude: 51.5125, longitude: 7.485});
datasource.on('complete', function(response) {
	console.log('complete: ' + response);
});