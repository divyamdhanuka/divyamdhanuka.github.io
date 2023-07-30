// Define data
var dataset = [
    { label: "Power", count: 39.3 },
    { label: "Industry", count: 28.9 },
    { label: "Transportation", count: 17.9 },
    { label: "Residential", count: 9.9 },
    { label: "International Bunkers", count: 3.1 },
    { label: "Domestic Aviation", count: 0.9 }
  ];
  
  // Chart dimensions
  var width = 1200;
  var height = 800;
  var radius = Math.min(width, height) / 2;
  
  // Legend dimensions
  var legendRectSize = 18;
  var legendSpacing = 6;
  
  // Define color scale with custom colors
  var colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"];
  var color = d3.scaleOrdinal().range(colors);
  
  var svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
  
  var arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);
  
  var pie = d3.pie()
    .value(function(d) { return d.count; })
    .sort(null);
  
  var path = svg.selectAll("path")
    .data(pie(dataset))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", function(d) { return color(d.data.label); })
    .each(function(d) { this._current = d; });
  
  var tooltip = d3.select("#chart")
    .append("div")
    .attr("class", "tooltip");
  
  tooltip.append("div").attr("class", "label");
  tooltip.append("div").attr("class", "count");
  
  path.on("mouseover", function(d) {
    var total = d3.sum(dataset.map(function(d) { return d.count; }));
    var percent = Math.round(1000 * d.data.count / total) / 10;
    tooltip.select(".label").html(d.data.label);
    tooltip.select(".count").html(percent + "%");
    tooltip.style("display", "block");

    // Add highlight effect
    d3.select(this)
        .transition()
        .duration(200)
        .attr("d", d3.arc()
            .innerRadius(0)
            .outerRadius(radius + 10) // Increase the outer radius for the highlight effect
        )
        .style("opacity", 0.8); // Reduce the opacity to create a highlight effect
  });
  
  path.on("mouseout", function() {
        tooltip.style("display", "none");
    // Remove highlight effect
    d3.select(this)
        .transition()
        .duration(200)
        .attr("d", arc)
        .style("opacity", 1); // Reset the opacity to remove the highlight effect
  });
  
  path.on("mousemove", function(d) {
    tooltip.style("top", (d3.event.layerY + 10) + "px")
      .style("left", (d3.event.layerX + 10) + "px");
  });
  
  var legend = svg.selectAll(".legend")
    .data(pie(dataset))
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) {
      var height = legendRectSize + legendSpacing;
      var offset = height * color.domain().length / 2;
      var horz = -2 * legendRectSize + 450;
      var vert = i * height - offset;
      return "translate(" + horz + "," + vert + ")";
    });
  
  legend.append("rect")
    .attr("width", legendRectSize)
    .attr("height", legendRectSize)
    .style("fill", function(d) { return color(d.data.label); })
    .style("stroke", function(d) { return color(d.data.label); })
    .on("click", function(label) {
      var rect = d3.select(this);
      var enabled = true;
      var totalEnabled = d3.sum(dataset.map(function(d) { return (d.enabled) ? 1 : 0; }));
  
      if (rect.classed("disabled")) {
        rect.classed("disabled", false);
      } else {
        if (totalEnabled < 2) return;
        rect.classed("disabled", true);
        enabled = false;
      }
  
      pie.value(function(d) {
        if (d.data.label === label.data.label) d.data.enabled = enabled;
        return (d.data.enabled) ? d.data.count : 0;
      });
  
      path = path.data(pie(dataset));
  
      path.transition()
        .duration(750)
        .attrTween("d", function(d) {
          var interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(0);
          return function(t) {
            return arc(interpolate(t));
          };
        });
    });
  
  legend.append("text")
    .attr("x", legendRectSize + legendSpacing)
    .attr("y", legendRectSize - legendSpacing)
    .text(function(d) { return d.data.label; });  