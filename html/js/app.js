(function() {
	var CONSTANTS = {
		LOCATION_TIMEOUT: 10000,
		DEFAULT_LOCATION: {
			LATITUDE: 37.774929,
			LONGITUDE: -122.419416,
			ZOOM: 12
		}
	};

	var MapView = Backbone.View.extend({
		el: '#map',
		_map: null,

		initialize: function(options) {
			this._server = options.server;
		},

		locate: function() {
			var self = this;

			self._defaultLocTimeout = setTimeout(function() {
                self._handleNoGeo();
            }, CONSTANTS.LOCATION_TIMEOUT);

			try {
                navigator.geolocation.getCurrentPosition(function(location) {
                	clearTimeout(self._defaultLocTimeout);

                	self._map.sensor = true;
                    var latLong = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
                    self._map.user_pos = latLong;

                    var marker = new google.maps.Marker({
                        title: 'You are here',
                        map: map,
                        position: latLong
                    });

                    self._map.setCenter(latLong);
                    self._request(latLong);
                }, function() {
                	self._handleNoGeo();
                });
			} catch (ignored) {
				self._handleNoGeo();
			}
		},

		findByZipcode: function(zipcode) {
			//todo: validate zipcode
			var self = this;
			var geocoder = new google.maps.Geocoder();
			
			var defaultLatLong = new google.maps.LatLng(CONSTANTS.DEFAULT_LOCATION.LATITUDE, CONSTANTS.DEFAULT_LOCATION.LONGITUDE);
			var location;

			geocoder.geocode({ 'address': zipcode, latLng: defaultLatLong }, function (results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					location = results[0].geometry.location;
					$('#msg').html(location);
					self._request(latLong);
				} else {
					$('#msg').html('Unable to geocode zipcode');
				}
			});			
		},

		_drawMarker: function(latLong) {
			var marker = new google.maps.Marker({map: self._map,
				position: latLong,
				icon: '/images/truck.png'
			});

			google.maps.event.addListener(marker, 'click', function(event) {            
            	window.open('http://maps.google.com/maps?q=' + encodeURIComponent(address));
        	});
		},

		_handleNoGeo: function() {
			var self = this;

			clearTimeout(self._defaultLocTimeout);
			$('#msg').html('Unable to locate, defaulting to SF').fadeOut(3000);

            var latLong = new google.maps.LatLng(CONSTANTS.DEFAULT_LOCATION.LATITUDE,CONSTANTS.DEFAULT_LOCATION.LONGITUDE);
            self._map.setCenter(latLong);
            self._map.setZoom(CONSTANTS.DEFAULT_LOCATION.ZOOM);
		},

		_request: function(latLong) {
			var self = this;

			//TODO: overlay

			var req = $.ajax({
				type: 'GET',
				url: [self.server, '/query'].join(''),
				data: {
					longitude: latLong.longitude,
					latitude: latLong.latitude
				}
			});

			req.done(function(response) {
				$('#output').html(response);
				//todo: also draw circle around markers

				// _.each(response.locations, function(latLong) {
				// 	self._drawMarker(latLong);
				// })
			});
			req.fail(function(response) {
				$('#msg').html('Unable to hit server').fadeOut(3000);
			});
		},

		render: function() {
			var self =  this;

			var mapOptions = {
          		center: new google.maps.LatLng(CONSTANTS.DEFAULT_LOCATION.LATITUDE,CONSTANTS.DEFAULT_LOCATION.LONGITUDE),
          		zoom: CONSTANTS.DEFAULT_LOCATION.ZOOM
        	};
			self._map = new google.maps.Map(self.el, mapOptions);
		}
	});

	$(document).ready(function() {
		var map = new MapView({server: window.pageData.serverLocation});
		map.render();

		$('#locate').on('click', function() {
			map.locate();
		});

		$('#zipFinder').on('click', function() {
			map.findByZipcode($('#zipcode').val());
		});		
	});
})();