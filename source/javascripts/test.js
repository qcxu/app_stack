function MapVis() {
this.centered;
this.active = d3.select(null);

	//Define path generator

this.clicked = function(d) {
	console.log("clicked");
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
	
	};

this.reset = function(d) {
  active.classed("active", false);
  active = d3.select(null);

  g.transition()
      .duration(750)
      .style("stroke-width", "1.5px")
      .attr("transform", "");
};

this.render = function() {
	queue()
	    .defer(d3.json, "./dmt.json")
	    .defer(d3.csv, "./centroid.csv")
	    .defer(d3.csv, "/conn.csv")
	    .await(this.ready);


this.ready = function(error, app, cntr, conn) {
		if (error) throw error;
		console.log(app);
		console.log(cntr);
		console.log(conn);	
		
	projection = d3.geo.albers()
	    .translate([width / 2, height / 2])
	    .scale(1080);
	    
	    svg.append("rect")
		.attr("class", "background")
		.attr("width", width)
		.attr("height", height)
		.on("click", this.reset);
	
	var g = svg.append("g");
		
	var stateById = d3.map(),
    positions = [];

  	cntr.forEach(function(d) {	
    	stateById.set(d.STATE, d);
    	d.outgoing = [];
    	d.incoming = [];
  	});
  	console.log(stateById);
  	
  	conn.forEach(function(d) {
	    var source = stateById.get(d.origin),
	        target = stateById.get(d.destination),
	        link = {source: source, target: target};
	        console.log(source);
	        console.log(target);
	    source.outgoing.push(link);
	    target.incoming.push(link);
	  });
	console.log(stateById);
  	
  	cntr = cntr.filter(function(d) {
	    if (d.count = Math.max(d.incoming.length, d.outgoing.length)) {
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
	// g.append("g")
		// .attr("id", "states");
	path = d3.geo.path()
			.projection(projection);
			
	var p = g.selectAll(".state")
		.data(topojson.feature(app, app.objects.state).features);
		p.enter()
		.append("path")
		.on("click", this.clicked)
		.attr("d", path)
		.attr("id", function(d) { return d.properties.STATE; })
		
		.each(addCircle);
		
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
		d3.select(this)
    .selectAll("g")
      .data(cntr.filter(function(D) { return D.STATE == d.properties.STATE; }))
    .enter().append("g")
      .attr("class", "airport");
	}

	};	
//Width and height
	//Define map projection
};
}


