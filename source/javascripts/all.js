//= require_tree .
var centered;
var active = d3.select(null);
var svg = d3.select("#vis_canvas");
var width = svg.attr("width");
console.log(width);
var height = svg.attr("height");
var projection = d3.geo.albersUsa()
				.translate([width / 2, height / 2])
				.scale([1280]);
//Define path generator
var path = d3.geo.path()
			.projection(projection);
			
svg.append("rect")
.attr("class", "background")
.attr("width", width)
.attr("height", height)
.on("click", reset);

var g = svg.append("g");

//Load in GeoJSON data
d3.json("./dmt.json", function(error, app) {
	if (error) throw error;
	console.log(app);
	//Bind data and create one path per GeoJSON feature
	g.append("g")
		.attr("id", "states")
		.selectAll("path")
		.data(topojson.feature(app, app.objects.state).features)
		.enter()
		.append("path")
		.attr("d", path)
		.on("click", clicked);
		
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

});
	//Create SVG element
	
	
//Width and height
	//Define map projection
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
	
	// console.log("clicked");
	// var x,
	    // y,
	    // k;
	// if (d && centered !== d) {
		// var centroid = path.centroid(d);
		// x = centroid[0];
		// y = centroid[1];
		// k = 10;
		// centered = d;
		// d3.selectAll(".region")
			// .style("opacity", "0")
			// .style("transition", "opacity 0.5s linear");
	// } else {
		// x = w / 2;
		// y = h / 2;
		// k = 1;
		// centered = null;
		// d3.selectAll(".region")
			// .style("opacity", "0.25")
			// .style("transition", "opacity 1.5s linear");
	// }
// 
	// g.selectAll("path").classed("active", centered &&
	// function(d) {
		// return d === centered;
	// });
// 
	// g.transition().duration(750).attr("transform", "translate(" + w / 2 + "," + h / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")").style("stroke-width", 1.5 / k + "px");
}

function reset() {
  active.classed("active", false);
  active = d3.select(null);

  g.transition()
      .duration(750)
      .style("stroke-width", "1.5px")
      .attr("transform", "");
}


