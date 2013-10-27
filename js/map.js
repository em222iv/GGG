window.onload = function(){

	
	var map;
	var split = true; // split to many renderers or not?
	var render = {
	    renders: [],
	    markers: [],
	
	    clear: function(){
			// Iterate through markers array and and un-set them from the map.
	        for(var i = 0; i < render.markers.length; i++){
	            render.markers[i].setMap(null);
	        }
			
			// clear the markers array
	        render.markers = [];
	
			
	        for(var i = 0; i < render.renders.length; i++){
	            render.renders[i].setMap(null);
	        }
	
			// clear the renders array
	        render.renders = [];
	    },
	
	    add: function(directions){
		// draggable makes direction line adapt when markers are dragged
	        var options = {
	            directions: directions,
	            draggable: true,
	            map: map,
	            preserveViewport: true,
	            markerOptions: {
	                draggable: true
	            }              
	        };

	        if(split){
	            options.markerOptions.visible = false;
	        }

			// create directions renderer object
	        var directionsRenderer = new google.maps.DirectionsRenderer(options);       

	        if(split){
				console.log(directions.routes[0]);
	            var marker = render.addMarker(directions.routes[0].legs[0].end_location, false);
	            render.renders.push(directionsRenderer);          
				
				var dragStages = ['dragstart', 'drag', 'dragend'];
				
	            $.each(['dragstart', 'drag', 'dragend'], function(index, value){
	                google.maps.event.addListener(render.markers[render.renders.length < 2 ? 0 : render.markers.length - 2], value, function(e) {
	                    var m = directionsRenderer.b.markers[0];                  
	                    m.setPosition(this.getPosition());
	                    google.maps.event.trigger(m, value, e);
	                });            
	            
	                google.maps.event.addListener(marker, value, function(e) {
	                    var l = directionsRenderer.b.markers.length - 1;
	                    directionsRenderer.b.markers[l].setPosition(this.getPosition());
	                    google.maps.event.trigger(directionsRenderer.b.markers[l], value, e);
	                });
	            });
	        }  

	        var compute = function() {
	            computeTotalDistance(render);            
	        }       
	        compute();
	        google.maps.event.addListener(directionsRenderer, 'directions_changed', compute);
	    },
	
	    addMarker: function(position, dragBoolean){
		// draggable makes markers draggable
	        var markerOptions = {
	            map: map,
	            draggable: dragBoolean,
	            zIndex: 10,
	            position: position,
				// marker icon
	            icon: 'http://maps.gstatic.com/mapfiles/markers2/marker_green' + String.fromCharCode(65 + render.markers.length) + '.png'
	        }
	        var marker = new google.maps.Marker(markerOptions);
	        render.markers.push(marker);
	        return marker;
	    },
	
	    legs: function(callback){
	        for (var i = 0; i < render.renders.length; i++) {            
	            for (var j = 0; j < render.renders[i].directions.routes[0].legs.length; j++) {
	                callback(render.renders[i].directions.routes[0].legs[j])
	            }
	        }
	    }
	};

	var origin;
	if(split){
		if(render.renders.length){
			var legs = render.renders[render.renders.length - 1].directions.routes[0].legs;
			origin = legs[legs.length - 1].end_location;
		}
		else{
			if(render.markers.length){
				// if there is any markers in the markers array, get the position for the first marker
				origin = render.markers[0].getPosition();
			}
			else{
				// for first click on the map - add marker to the markers array (generates origin marker)
				var options = {
					enableHighAccuracy: true
				};
				
				function success(pos){
					var lat = pos.coords.latitude;
					var lon = pos.coords.longitude;
					
					// var accuracy = pos.coords.accuracy;
					var latlng = new google.maps.LatLng(lat, lon);

					var mapOptions = {
						zoom: 15,
						center: latlng,
						mapTypeId: google.maps.MapTypeId.ROADMAP
					};
					
					mapHolder = document.querySelector('#map');
					map = new google.maps.Map(mapHolder, mapOptions);
					render.addMarker(latlng, true);
					origin = render.markers[0].getPosition();
					console.log(origin);
					
					if(origin){
			            getDirection({
			                origin: origin,
			                destination: new google.maps.LatLng(56.668915, 16.345097)
			            }, render.add);
			        }
				}
				
				function error(e){
					alert("Geolocation error " + e.code + ": " + e.message);
				}

				if(navigator.geolocation){
					navigator.geolocation.getCurrentPosition(success, error, options);
				}
				else{
					element.innerHTML = "Geolocation not supported in this browser.";
				}
			}
		}
	}

	var clearButton = document.querySelector("#clear");
	clearButton.onclick = function(){
		render.clear();
		var totalBox = document.querySelector('#total');
		console.log(totalBox);
	}	
}

function getDirection(route, callback){
	var directionsService = new google.maps.DirectionsService();
    var request = {
        avoidHighways: true,
        avoidTolls: true,
        origin: toLocation(route.origin),
        destination: toLocation(route.destination),
        waypoints: route.waypoints,
        provideRouteAlternatives: false,
        travelMode: google.maps.DirectionsTravelMode.WALKING // BICYCLING
    };

    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {                  
            callback(response);
        }
		else{
            alert(status);
        }
    });
}

function computeTotalDistance(renderObj) {
    var total = 0;

    renderObj.legs(function(leg){
        total += leg.distance.value;
    });  

    total = total / 1000;
	
	var pTag = document.createElement('p');
	pTag.innerHTML += total + " km";
	var totalBox = document.querySelector('#total');
	totalBox.appendChild(pTag);
}

function toLocation(location){
    if(location instanceof google.maps.LatLng){
        return location;
    }else 
		if(typeof location == "object"){
        return new google.maps.LatLng(location.lat, location.lng);
    }
    return location;
}

function fromLocation(location){
    if(location instanceof google.maps.LatLng){
        return {
            lat: location.lat(),
            lng: location.lng()
        };
    } 
}