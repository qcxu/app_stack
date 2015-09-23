//= require_tree .
var centered;
var active = d3.select(null);
var svg = d3.select("#vis_canvas");
var width = svg.attr("width");
console.log(width);
var height = svg.attr("height");
var projection = d3.geo.albers()
    .translate([width / 2, height / 2])
    .scale(1080);
//Define path generator
var path = d3.geo.path()
			.projection(projection);
			
var voronoi = d3.geom.voronoi()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .clipExtent([[0, 0], [width, height]]);
			
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
		.each(addCircle)
		.attr("d", path)
		.attr("id", function(d) { return d.properties.STATE; })
		.on("click", clicked)
		.on("mouseover", displayLine)
		.on("mouseout", hideLine);
		
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
		var air = d3.select(this.parentNode)
    .selectAll("g")
      .data(cntr.filter(function(D) { return D.STATE == d.properties.STATE; }))
    .enter().append("g")
      .attr("class", "airport")
      .append("g")
      .attr("class", "airport-arcs")
      .each(addLine);
	}
	
	function addLine(d) {
		d3.select(this)
		.append("circle")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("r", function(d, i) { return Math.sqrt(d.count); });
      d3.select(this)
		.selectAll("path")
		.data(function(d) {return d.linking;})
		.enter().append("path")
		.attr("d", function(d) { return path({type: "LineString", coordinates: [d.source, d.target]}); });
	}

};

function displayLine(d) {
	d3.select(this.parentNode)
		.select(".airport")
		.attr("class", "dis");
	// d3.select(this.parentNode)
		// .select(".airport")
		// .attr("class", "a");
}

function hideLine(d) {
	// d3.select(this.parentNode)
		// .select(".airport")
		// .classed("a", false);
	d3.select(this.parentNode)
		.select(".dis")
		.attr("class", "airport");
	
}
	
function clicked(d) {
	if (active.node() === this) {
		d3.selectAll(".region")
			.style("opacity", "0.25")
			.style("transition", "opacity 0.5s linear 0.5s");
		return reset();
	}
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

  g.transition()
      .duration(750)
      .style("stroke-width", "1.5px")
      .attr("transform", "");
}


