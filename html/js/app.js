(function() {
	var CONSTANTS = {
		LOCATION_TIMEOUT: 10000,
		DEFAULT_LOCATION: {
			LATITUDE: 37.774929,
			LONGITUDE: -122.419416,
			ZOOM: 15
		}
	};

	var MapView = Backbone.View.extend({
		el: '#map',
		_map: null,

		initialize: function(options) {
			this._server = options.server;
            this._markers = [];
            this.infoTemplate = _.template("<b><%=name%></b><br/><%= description %>");
		},

		locate: function() {
			var self = this;

			self._defaultLocTimeout = setTimeout(function() {
                self._handleNoGeo();
            }, CONSTANTS.LOCATION_TIMEOUT);

			try {
                navigator.geolocation.getCurrentPosition(function(location) {
                	clearTimeout(self._defaultLocTimeout);

                    var latLong = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
                    self._map.user_pos = latLong;

                    self._map.setCenter(latLong);
                    self._drawSelf();
                    self._request({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                    });
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
					self._request({
                        latitude: location.lat(),
                        longitude: location.lng()
                    });
				} else {
                    self._overlay(true, 'Unable to geocode zipcode', 3000);
				}
			});			
		},

        _drawSelf: function() {
            var self = this;
            var selfMarker = new google.maps.Marker({map: self._map,
                position: self._map.user_pos,
                icon: 'img/pegman.gif',
                zIndex: 3
            });

            google.maps.event.addListener(selfMarker, 'click', function(event) {
                var infowindow = new google.maps.InfoWindow({
                    content: self.infoTemplate({name: 'This is you!', description:''})
                });

                infowindow.open(self._map, selfMarker);
            });

            self._markers.push(selfMarker);
        },

		_drawMarker: function(foodTruck) {
            var self = this;

            var latLong = new google.maps.LatLng(foodTruck.location.latitude, foodTruck.location.longitude);
			var marker = new google.maps.Marker({map: self._map,
				position: latLong,
				icon: 'img/truck.png',
                zIndex: 2
			});
            self._markers.push(marker);

			google.maps.event.addListener(marker, 'click', function(event) {
                if (self._infoWindow) {
                    self._infoWindow.close();
                }

                self._infoWindow = new google.maps.InfoWindow({
                    content: self.infoTemplate(foodTruck)
                });

                self._infoWindow.open(self._map, marker);
        	});
		},

        _clearMarkers: function() {
            var self = this;
            _.each(self._markers, function(marker) {
                marker.setMap(null);
            });
        },

		_handleNoGeo: function() {
			var self = this;

			clearTimeout(self._defaultLocTimeout);
            self._overlay(true, 'Unable to locate, defaulting to San Francisco', 3000);

            var latLong = new google.maps.LatLng(CONSTANTS.DEFAULT_LOCATION.LATITUDE,CONSTANTS.DEFAULT_LOCATION.LONGITUDE);
            self._map.setCenter(latLong);
            self._map.setZoom(CONSTANTS.DEFAULT_LOCATION.ZOOM);
		},

		_request: function(latLong) {
			var self = this;

			self._overlay(true);
            self._clearMarkers();

            self._map.user_pos = new google.maps.LatLng(latLong.latitude, latLong.longitude);
            self._drawSelf();

			var req = $.ajax({
                dataType: 'jsonp',
				url: [self._server, '/query'].join(''),
				data: {
					longitude: latLong.longitude,
					latitude: latLong.latitude
				}
			});

			req.done(function(locations) {
                self._map.panTo(self._map.user_pos);

                var circle = new google.maps.Circle({
                    strokeColor: '#3276b1',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#3276b1',
                    fillOpacity: 0.35,
                    map: self._map,
                    center: self._map.user_pos,
                    radius: 600,
                    zIndex: 1
                });

                self._markers.push(circle);

				_.each(locations, function(foodTruck) {
					self._drawMarker(foodTruck);
				});

                self._overlay(false);
			});
			req.fail(function(response) {
                self._overlay(true, 'Unable to access remote server', 3000);
			});
		},

        _overlay: function(enable, msg, fadeDelay) {
            var $overlay = $("#overlay");
            $overlay.find('h4').html(msg);

            if (enable) {
                $overlay.show();
                if (fadeDelay) {
                    $overlay.fadeOut(fadeDelay);
                }
            } else {
                $overlay.hide();
            }
        },

		render: function() {
			var self =  this;

			var mapOptions = {
          		center: new google.maps.LatLng(CONSTANTS.DEFAULT_LOCATION.LATITUDE,CONSTANTS.DEFAULT_LOCATION.LONGITUDE),
          		zoom: CONSTANTS.DEFAULT_LOCATION.ZOOM,
                disableDefaultUI: true
        	};
			self._map = new google.maps.Map(self.el, mapOptions);

            google.maps.event.addListener(self._map, 'dragend', function() {
                var mapCenter = self._map.getCenter();

                self._request({
                    latitude: mapCenter.lat(),
                    longitude: mapCenter.lng()
                })
            });
            self._overlay(false);
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

        $("#zipcode").on('keypress', function(e) {
            if (e.keyCode == 13) {
                map.findByZipcode($(this).val());
            }
        });
	});
})();