async function drawLineChart() {
    const dataset = await d3.csv("sea_levels_2015.csv", d => ({
      date: new Date(d.Time),
      seaLevel: +d["Global Mean Sea Level"],
    }));
  
    const width = 960;
    const height = 500;
    const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  
    const svg = d3.select("#container").append("svg")
      .attr("width", width)
      .attr("height", height);
  
    const yMin = -140.1;
    const yMax = 82.4;
  
    const y = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([height - margin.bottom, margin.top]);
  
    const colorScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range(["lightblue", "darkblue"]);
  
    const x = d3.scaleTime()
      .domain(d3.extent(dataset, d => d.date))
      .range([margin.left, width - margin.right]);
  
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.seaLevel));
  
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", y(yMin))
      .attr("x2", 0).attr("y2", y(yMax));
  
    gradient.selectAll("stop")
      .data([
        { offset: "0%", color: "lightblue" },
        { offset: "100%", color: "darkblue" }
      ])
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);
  
    svg.append("path")
      .datum(dataset)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2)
      .attr("d", line);
  
    const yAxisGridlines = d3.axisLeft(y)
      .tickSize(-width + margin.right + margin.left)
      .tickFormat("");
    svg.append("g")
      .attr("class", "y-axis-gridlines")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxisGridlines);
  
    const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
  
    const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove());
  
    const xAxisGridlines = d3.axisBottom(x)
      .tickSize(-height + margin.top + margin.bottom)
      .tickFormat("");
    svg.append("g")
      .attr("class", "x-axis-gridlines")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxisGridlines);
  
    svg.append("g")
      .call(xAxis);
  
    svg.append("g")
      .call(yAxis);
    
    // Adding x-axis label
    svg.append("text")             
      .attr("transform", `translate(${width/2}, ${height + margin.top + 40})`)
      .style("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Time");
  
    // Adding y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 20)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1.2em")
      .style("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Global Mean Sea Level");
  
    // Adding chart title
    d3.select("#scontainer")
      .insert("div", ":first-child")
      .attr("id", "chart-title")
      .style("text-align", "center")
      .html("Global Mean Sea Level Over Time");
  
    // Tooltip and interactivity
    const tooltip = d3.select("#container").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  
    const focus = svg.append("g")
      .attr("class", "focus")
      .style("display", "none");
  
    focus.append("circle")
      .attr("r", 4.5);
  
    const formatTime = d3.timeFormat("%b %Y"); // Format for month and year
  
    const bisectDate = d3.bisector(d => d.date).left;
  
    svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("x", margin.left)
      .attr("y", margin.top)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", () => {
        focus.style("display", null);
        tooltip.style("opacity", 0.7);
      })
      .on("mouseout", () => {
        focus.style("display", "none");
        tooltip.style("opacity", 0);
      })
      .on("mousemove", mousemove);
  
    function mousemove() {
      const x0 = x.invert(d3.mouse(this)[0]);
      const i = bisectDate(dataset, x0, 1);
      const d0 = dataset[i - 1];
      const d1 = dataset[i];
      const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      focus.attr("transform", `translate(${x(d.date)}, ${y(d.seaLevel)})`);
      tooltip.html(`Time: ${formatTime(d.date)}<br>Global Mean Sea Level Change: ${d.seaLevel.toFixed(2)}`)
        .style("left", `${d3.event.pageX + 15}px`)
        .style("top", `${d3.event.pageY - 28}px`);
    }
  }
  
  drawLineChart();
  