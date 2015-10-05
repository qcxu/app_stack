//= require_tree .
var centered;
var active = d3.select(null);
var svg = d3.select("#vis_canvas");
var width = svg.attr("width");
console.log(width);
var height = svg.attr("height");
var projection = d3.geo.albers()
    .translate([width / 1.8, height / 1.4])
    .scale(1000);
//Define path generator
var path = d3.geo.path()
			.projection(projection);
			
			
svg.append("rect")
.attr("class", "background")
.attr("width", width)
.attr("height", height)
.on("click", reset);

var g = svg.append("g");

queue()
    .defer(d3.json, "./dmt.json")
    .defer(d3.csv, "./centroid.csv")
    .defer(d3.csv, "/conn.csv")
    .await(ready);


//Load in GeoJSON data
function ready(error, app, cntr, conn) {
	if (error) throw error;
	console.log(app);
	console.log(cntr);
	console.log(conn);
	
	var stateById = d3.map(),
    positions = [];

  	cntr.forEach(function(d) {	
    	stateById.set(d.STATE, d);
    	d.linking = [];
    	//d.outgoing = [];
    	//d.incoming = [];
  	});
  	console.log(stateById);
  	
  	conn.forEach(function(d) {
	    var source = stateById.get(d.origin),
	        target = stateById.get(d.destination),
	        link = {source: source, target: target};
	        console.log(source);
	        console.log(target);
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
		.data(topojson.feature(app, app.objects.state).features)
		.enter()
		.append("g")
		.append("path")
		.attr("d", path)
		.attr("id", function(d) { return d.properties.STATE; })
		.on("click", clicked)
		.on("mouseover", addCircle)
		.on("mouseout", function() {
			svg.selectAll(".airport").remove();
			d3.selectAll(".connected").classed("connected", false);
			});
		
	g.append("g")
		.attr("id", "regions")
		.selectAll("path")
		.data(topojson.feature(app, app.objects.regions).features)
		.enter()
		.append("path")
		.attr("d", path);
		
	g.append("path")
      .datum(topojson.mesh(app, app.objects.regions, function(a, b) { return a !== b; }))
      .attr("id", "region-borders")
      .attr("d", path);
		
	g.append("g")
	.attr("id", "region_text")
	.selectAll("text")
	.data(topojson.feature(app, app.objects.regions).features)
	.enter().append("text")
	.attr("class", function(d) { return "region " + d.properties.REGIONCE; })
	.attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
	.attr("dx", "-1em")
	.text(function(d) { return d.properties.NAME; });
	
	// Centroid
	function addCircle(d) {
		var filtered_cntr = cntr.filter(function(D) { return D.STATE == d.properties.STATE; });

		if(filtered_cntr.length != 0) {
		
			var rel = g.append("g")
			.attr("class", "airport")
 			.data(filtered_cntr);
   
     		rel.append("circle")
      		.attr("transform", function(g) { return "translate(" + g.x + "," + g.y + ")"; })
      		.attr("r", function(g, i) { return Math.sqrt(g.count); });
      
			rel.selectAll("path")
			.data(function(g) {return g.linking;})
			.enter().append("path")
			.attr("d", function(f) { return path({type: "LineString", coordinates: [f.source, f.target]}); });
		
			// Hover linked states
			var state = filtered_cntr[0].linking;
			console.log(state);
			var state_id = state.map(function(g) {
				return (g.source.STATE == filtered_cntr[0].STATE) ? g.target.STATE:g.source.STATE;
			});
			console.log(state_id);
			state_id.forEach(function(g) {console.log(g);document.getElementById(g).classList.add("connected");});
			
			
			
		}
		
	}
	
};


function clicked(d) {
	if (active.node() === this) {
		d3.selectAll(".region")
			.style("opacity", "0.25")
			.style("transition", "opacity 0.5s linear 0.5s");
		return reset();
	}
	svg.selectAll(".airport").remove();
  	active.classed("active", false);
  	active = d3.select(this).classed("active", true);
	
	d3.selectAll(".region")
		.style("opacity", "0")
		.style("transition", "opacity 0.5s linear");
	
  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = 1 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  g.transition()
      .duration(750)
      .style("stroke-width", 1.5 / scale + "px")
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
}

function reset() {
  active.classed("active", false);
  active = d3.select(null);
  svg.selectAll(".airport").remove();
  g.transition()
      .duration(750)
      .style("stroke-width", "1.5px")
      .attr("transform", "");
}


