var Data = require('../lib/data');
var datasource = new Data({datasource: 'http://data.sfgov.org/resource/rqzj-sfat.json'});

datasource.query({block: 3708});
datasource.on('complete', function(response) {
	console.log('complete: ' + response);
});