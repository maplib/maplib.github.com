$( function() {
	var server, maps, map, selected, showPolygons;

	function refreshMapsList() {
		var zoom, bounds, sw, ne, html, i;
		zoom = map.getZoom();
		bounds = map.getBounds();
		sw = bounds.getSouthWest();
		ne = bounds.getNorthEast();
		html = '';
		for ( i in maps ) {
			if ( i === selected ) {
				html += '<div id="map-' + i + '" class="selected">' + maps[i].title + '</div>';
			}
			else if (
				maps[i].minZoom <= zoom && maps[i].maxZoom >= zoom
				&& maps[i].ne.lat > sw.lat && maps[i].sw.lat < ne.lat
				&& maps[i].ne.lng > sw.lng && maps[i].sw.lng < ne.lng
			) {
				html += '<div id="map-' + i + '">' + maps[i].title + '</div>';
			}
		}
		$('#list').html(html);
	}

	maps = {};
	$.getJSON( 'maps.json', function(data) {
		var i, row;
		server = data.server;
		for ( i in data.maps ) {
			row = data.maps[i];
			maps[i] = {
				title: row[0],
				sw: new L.LatLng( row[1], row[2] ),
				nw: new L.LatLng( row[3], row[2] ),
				ne: new L.LatLng( row[3], row[4] ),
				se: new L.LatLng( row[1], row[4] ),
				minZoom: row[5],
				maxZoom: row[6],
				layer: new L.TileLayer( server + '/maps/' + i + '/{z}/{x}/{y}.png' )
			};
			maps[i].polygon = new L.Polygon([
				maps[i].sw,
				maps[i].nw,
				maps[i].ne,
				maps[i].se
			], {
				weight: 1,
				clickable: false
			});
		}
		refreshMapsList();
	});

	map = new L.Map('map');
	map.addLayer( new L.TileLayer( 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: 'OSM layer &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors'
			+ ', <a href="http://www.creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
	}));
	map.setView( new L.LatLng(
		localStorage.getItem('lat') || 55.755786,
		localStorage.getItem('lng') || 37.617633
	), localStorage.getItem('zoom') || 10 );

	map.on( 'moveend', function() {
		var center, zoom;
		center = map.getCenter();
		zoom = map.getZoom();
		localStorage.setItem( 'lat', center.lat );
		localStorage.setItem( 'lng', center.lng );
		localStorage.setItem( 'zoom', zoom );
		refreshMapsList();
	});

	showPolygons = true;
	$('#list div')
		.live( 'mouseover', function() {
			var id;
			id = $(this).attr('id').substr(4);
			if ( showPolygons && id !== selected ) {
				map.addLayer( maps[id].polygon );
			}
		})
		.live( 'mouseout', function() {
			var id;
			id = $(this).attr('id').substr(4);
			map.removeLayer( maps[id].polygon );
			showPolygons = true;
		})
		.live( 'click', function() {
			var id;
			id = $(this).attr('id').substr(4);
			if ( id === selected ) {
				selected = null;
				map.removeLayer( maps[id].layer );
				map.options.minZoom = 0;
				map.options.maxZoom = 18;
				showPolygons = false;
			}
			else {
				if (selected) {
					map.removeLayer( maps[selected].layer );
				}
				selected = id;
				map.addLayer( maps[id].layer );
				map.removeLayer( maps[id].polygon );
				map.options.minZoom = maps[id].minZoom;
				map.options.maxZoom = maps[id].maxZoom;
			}
			refreshMapsList();
		});
});
