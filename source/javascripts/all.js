//= require_tree .
var centered;
var active = d3.select(null);
var svg = d3.select("#vis_canvas");
var width = svg.attr("width");
console.log(width);
var height = svg.attr("height");
var projection = d3.geo.albersUsa()
    .translate([width / 2, height / 2])
    .scale(1600);
//Define path generator
var path = d3.geo.path()
			.projection(projection);
			
var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 8])
    .on("zoom", zoomed);
			
			
svg.append("rect")
.attr("class", "background")
.attr("width", width)
.attr("height", height)
//.on("click", reset)
.call(zoom);

var g = svg.append("g")
			.call(zoom);


queue()
    .defer(d3.json, "data/region.json")
    .defer(d3.json, "data/state_new.json")
    .defer(d3.json, "data/city_new.json")
    .defer(d3.csv, "data/city_centroid.csv")
    .defer(d3.csv, "data/conn.csv")
    .await(ready);


//Load in GeoJSON data
function ready(error, region, state, city, cntr, conn) {
	if (error) throw error;
	console.log(region);
	console.log(state);
	console.log(city);
	
	var stateById = d3.map(),
    positions = [];

  	cntr.forEach(function(d) {	
    	stateById.set(d.CBSAFP, d);
    	d.linking = [];
    	//d.outgoing = [];
    	//d.incoming = [];
  	});
  	console.log(stateById);
  	
  	conn.forEach(function(d) {
  		//console.log(d.origin);
	    var source = stateById.get(d.origin),
	        target = stateById.get(d.destination),
	        link = {source: source, target: target};
	        // console.log(source);
	        // console.log(target);
	    // source.outgoing.push(link);
	    // target.incoming.push(link);
	    source.linking.push(link);
	   	target.linking.push(link);
	  });
	console.log(stateById);
  	
  	cntr = cntr.filter(function(d) {
	    if (d.count = d.linking.length) {
	      d[0] = +d.X;
	      d[1] = +d.Y;
	      var position = projection(d);
	      d.x = position[0];
	      d.y = position[1];
	      return true;
	    }
	});
	console.log(cntr);
	
	//Bind data and create one path per GeoJSON feature
	g.append("g")
		.attr("id", "states");
		
	d3.select("#states")
		.selectAll("g")
		.select("path")
		.data(topojson.feature(state, state.objects.state_v3).features)
		.enter()
		.append("g")
		.append("path")
		.attr("d", path)
		.attr("id", function(d) { return d.properties.STATEFP; });
		//.on("click", clicked)
		// .on("mouseover", addCircle)
		// .on("mouseout", function() {
			// svg.selectAll(".airport").remove();
			// d3.selectAll(".connected").classed("connected", false);
			// });
		
	g.append("g")
		.attr("id", "regions")
		.selectAll("path")
		.data(topojson.feature(region, region.objects.region_v1).features)
		.enter()
		.append("path")
		.attr("d", path);
	
	g.append("g")
		.attr("id", "cities");
	d3.select("#cities")
		.selectAll("g")
		.select("path")
		.data(topojson.feature(city, city.objects.city_v4).features)
		.enter()
		.append("g")
		.append("path")
		.attr("d", path)
		.attr("id", function(d) { return d.properties.CBSAFP; })
		.on("click", clicked)
		.on("mouseover", addCircle)
		.on("mouseout", function() {
			svg.selectAll(".airport").remove();
			d3.selectAll(".connected").classed("connected", false);
			});
			
	g.append("path")
      .datum(topojson.mesh(state, state.objects.state_v3, function(a, b) { return a !== b; }))
      .attr("id", "state-borders")
      .attr("d", path);
	
	var filtered_city = topojson.feature(city, city.objects.city_v4).features;
	var filtered_city = filtered_city.filter(function(d) {return d.properties.isApp == 1;});
	g.append("g")
	.attr("id", "city-text")
	.selectAll("text")
	.data(filtered_city)
	.enter().append("text")
	.attr("class", function(d) { return "city " + d.properties.CBSAFP; })
	.attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
	//.attr("dx", "-2em")
	.attr("text-anchor", "middle")
	.text(function(d) { return d.properties.NAME; });
	
	var filtered_state = topojson.feature(state, state.objects.state_v3).features;
	console.log(filtered_state);
	var filtered_state = filtered_state.filter(function(d) {return d.properties.isFunc == 1;});
	g.append("g")
	.attr("id", "state-text")
	.selectAll("text")
	.data(filtered_state)
	.enter().append("text")
	.attr("class", function(d) { return "state " + d.properties.STATEFP; })
	.attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
	//.attr("dx", "-0.5em")
	.attr("text-anchor", "middle")
	.text(function(d) { return d.properties.NAME; });
	
	// Centroid
	function addCircle(d) {
		var filtered_cntr = cntr.filter(function(D) { return D.CBSAFP == d.properties.CBSAFP; });

		if(filtered_cntr.length != 0 & zoom.scale() > 4) {
		
			var rel = g.append("g")
			.attr("class", "airport")
 			.data(filtered_cntr);
   
     		
      
			rel.selectAll("path")
			.data(function(g) {return g.linking;})
			.enter().append("path")
			.attr("d", function(f) { return path({type: "LineString", coordinates: [f.source, f.target]}); })
			.style("stroke-width", 1/zoom.scale());
			
			
		
			// Hover linked states
			var state = filtered_cntr[0].linking;
			console.log(state);
			var state_id = state.map(function(g) {
				return (g.source.CBSAFP == filtered_cntr[0].CBSAFP) ? g.target.CBSAFP:g.source.CBSAFP;
			});
			//console.log(state_id);
			state_id.forEach(function(g) {document.getElementById(g).classList.add("connected");});
			
			rel.append("circle")
      		.attr("transform", function(g) { return "translate(" + g.x + "," + g.y + ")"; })
      		.attr("r", 1/zoom.scale());
		
		}
		
	}
	
};


function clicked(d) {
	d3.selectAll(".connected").classed("connected", false);
	if (active.node() === this) {
		var t = zoom.translate();
		var s = zoom.scale();
		console.log(s);
		d3.selectAll("#state-text text")
			.style("opacity", "0.2")
			.style("transition", "opacity 0.5s linear 0.5s");
		return reset(t,s);
	}
	svg.selectAll(".airport").remove();
  	active.classed("active", false);
  	active = d3.select(this).classed("active", true);
	
	d3.selectAll("#state-text text")
		.style("opacity", "0")
		.style("transition", "opacity 0.5s linear");
	
  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = 1 / Math.min(dx / width, dy / height) - 10,
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  g.transition()
      .duration(750)
      .style("stroke-width", 1.5 / scale + "px")
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
}

function reset(t,s) {
  active.classed("active", false);
  active = d3.select(null);
  svg.selectAll(".airport").remove();
  g.transition()
      .duration(750)
      .style("stroke-width", "1.5px")
      .attr("transform", "translate(" + t + ")scale(" + s + ")");
}

function zoomed() {
  g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  d3.selectAll(".connected").classed("connected", false);
  d3.selectAll(".active").classed("active", false);
  //console.log(zoom.scale());
  if (zoom.scale() >= 2 && zoom.scale() <= 4) {
  	g.selectAll("#cities path").classed("show", true);
  	g.selectAll("#city-text text").classed("show", false);
  } else if (zoom.scale() > 4) {
  	g.selectAll("#cities path").classed("show", true);
  	g.selectAll("#city-text text").classed("show", true);
  } else {
  	g.selectAll("#cities path").classed("show", false);
  	g.selectAll("#city-text text").classed("show", false);
  }
  
}



