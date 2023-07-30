async function drawLineChart() {
    const dataset = await d3.csv("data.csv", d => ({
        date: new Date(d.Year, 0, 1),
        anomaly: +d.Anomaly
    }));

    const width = 960;
    const height = 500;
    const margin = { top: 20, right: 30, bottom: 30, left: 60 };

    const svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height);

    const yMin = -0.55;
    const yMax = 1.14;

    const y = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height - margin.bottom, margin.top]);

    const x = d3.scaleTime()
        .domain(d3.extent(dataset, d => d.date))
        .range([margin.left, width - margin.right]);

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.anomaly));

    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "line-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0).attr("y1", y(0))
        .attr("x2", 0).attr("y2", y(1));

    const colorStops = [
        { offset: "0%", color: "blue" },
        { offset: "32.54%", color: "white" },
        { offset: "100%", color: "red" }
    ];

    gradient.selectAll("stop")
        .data(colorStops)
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
        .text("Year");

    // Adding y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 20)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1.2em")
        .style("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("Temperature Anomaly (°C)");

    // Adding chart title
    d3.select("#container")
        .insert("div", ":first-child")
        .attr("id", "chart-title")
        .style("text-align", "center")
        .html("Temperature Anomaly Over Time");

    // Tooltip and interactivity
    const tooltip = d3.select("#container").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("circle")
        .attr("r", 4.5);

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
        focus.attr("transform", `translate(${x(d.date)}, ${y(d.anomaly)})`);
        tooltip.html(`Year: ${d.date.getFullYear()}<br>Anomaly: ${d.anomaly.toFixed(2)} °C`)
            .style("left", `${d3.event.pageX + 15}px`)
            .style("top", `${d3.event.pageY - 28}px`);
    }

    // Find maximum anomaly value
    let maxAnomalyValue = d3.max(dataset, d => d.anomaly);

    // Find the index of maximum anomaly
    let maxAnomalyIndex = dataset.findIndex(d => d.anomaly === maxAnomalyValue);

    let maxAnomalyData = dataset[maxAnomalyIndex];

    const type = d3.annotationCustomType(
    d3.annotationXYThreshold,
    {"note":{
        "lineType":"none",
        "orientation": "topBottom",
        "align":"middle"}
    }
);

let annotations = [{
    note: {
        title: "Highest Temperature Anomaly",
        label: `Year: ${maxAnomalyData.date.getFullYear()}, Anomaly: ${maxAnomalyData.anomaly.toFixed(2)} °C`,
        wrap: 150
    },
    x: x(maxAnomalyData.date),
    y: y(maxAnomalyData.anomaly),
    dy: 50,
    dx: -250
}];

const makeAnnotations = d3.annotation()
    .type(type)
    .annotations(annotations)
    .accessors({
        x: d => x(d.date),
        y: d => y(d.anomaly)
    })
    .accessorsInverse({
        date: d => x.invert(d.x),
        anomaly: d => y.invert(d.y)
    });

svg.append("g")
    .attr("class", "annotation-group")
    .call(makeAnnotations);
        
    }

drawLineChart();
