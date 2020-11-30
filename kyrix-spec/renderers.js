var renderingParams = {
    maxBuildingHeight: 275,
    maxCircleRadius: 15,
    textwrap: require("../../src/template-api/Utilities").textwrap
};

var buildingCircleRendering = function(svg, data, args) {
    g = svg.append("g");
    var params = args.renderingParams;
    var circleRadiusScale = d3
        .scaleLinear()
        .domain([0, params.maxBuildingHeight])
        .range([0, params.maxCircleRadius]);
    var circleColorScale = d3.scaleOrdinal(
        ["RESIDENT", "ACADEMIC", "SERVICE"],
        d3.schemeTableau10
    );

    g.selectAll(".buildingcircle")
        .data(data)
        .join("circle")
        .attr("r", d => circleRadiusScale(+d["building_height"]))
        .attr("cx", d => +d.cx)
        .attr("cy", d => +d.cy)
        .style("fill-opacity", 0)
        .attr("stroke", d => circleColorScale(d["building_type"]))
        .style("stroke-width", "2px")
        .classed("kyrix-retainsizezoom", true);
};

var buildingLegendRendering = function(svg, data, args) {
    var params = args.renderingParams;
    var radiusScale = d3
        .scaleLinear()
        .domain([0, params.maxBuildingHeight])
        .range([0, params.maxCircleRadius]);
    var colorScale = d3.scaleOrdinal(
        ["RESIDENT", "ACADEMIC", "SERVICE"],
        d3.schemeTableau10
    );
    var legendOrdinal = d3
        .legendColor()
        .shape("rect")
        .shapePadding(5)
        .title("Building Type")
        .labelOffset(13)
        .scale(colorScale);

    var legendG = svg
        .append("g")
        .classed("building_legend", true)
        .style("opacity", 0.5)
        .attr("transform", "translate(50, 0)");
    legendG
        .append("g")
        .attr("transform", "translate(0, 20) scale(1)")
        .call(legendOrdinal);

    var legendSize = d3
        .legendSize()
        .scale(radiusScale)
        .shape("circle")
        .shapePadding(25)
        .labelOffset(20)
        .title("Building Height (ft)")
        .orient("horizontal");
    legendG
        .append("g")
        .attr("transform", "translate(120, 20)")
        .call(legendSize);
    legendG
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", legendG.node().getBBox().width)
        .attr("height", legendG.node().getBBox().height)
        .style("opacity", 0)
        .on("mouseover", function() {
            d3.selectAll(".building_legend").style("opacity", 1);
        })
        .on("mouseout", function() {
            d3.selectAll(".building_legend").style("opacity", 0.5);
        });
};

var roomBarChartRendering = function(svg, data, args) {
    var g = svg.append("g");
    var params = args.renderingParams;

    // aggregate data by major use and minor use
    var minorUseMap = {};
    var agg = {};
    for (var i = 0; i < data.length; i++) {
        var majorUse = data[i].major_use_desc;
        var minorUse = data[i].use_desc;
        minorUseMap[minorUse] = true;
        // create keys
        if (!(majorUse in agg)) agg[majorUse] = {};
        if (!(minorUse in agg[majorUse])) agg[majorUse][minorUse] = 0;
        // aggregate
        agg[majorUse][minorUse] += isNaN(data[i].area.replace(/,/g, ""))
            ? 0
            : +data[i].area.replace(/,/g, "");
    }

    // set up scales
    var majorUses = Object.keys(agg);
    var minorUses = Object.keys(minorUseMap);
    var vw = args.viewportW;
    var vh = args.viewportH;
    var barSpanLength = majorUses.length * 80;
    var x = d3
        .scaleBand()
        .domain(majorUses)
        .range([vw / 3 - barSpanLength / 2, vw / 3 + barSpanLength / 2])
        .padding(0.2);
    var y = d3
        .scaleLinear()
        .domain([
            0,
            d3.max(
                majorUses.map(d =>
                    d3.sum(minorUses.map(p => (p in agg[d] ? agg[d][p] : 0)))
                )
            )
        ])
        .range([vh - 100, 100]);
    var colors = d3.schemePaired;

    // append rectangles
    for (var i = 0; i < majorUses.length; i++) {
        var majorUse = majorUses[i];
        var curH = 0;
        for (var j = 0; j < minorUses.length; j++) {
            var minorUse = minorUses[j];
            if (!(minorUse in agg[majorUse])) continue;
            var curArea = agg[majorUse][minorUse];
            curH += curArea;
            g.append("rect")
                .datum({
                    major_use: majorUse,
                    minor_use: minorUse,
                    area: curArea
                })
                .attr("x", x(majorUse))
                .attr("y", y(curH))
                .attr("width", x.bandwidth())
                .attr("height", vh - 100 - y(curArea))
                .attr("fill", colors[j % 12]);
        }
    }

    // x axis
    g.append("g")
        .attr("transform", `translate(0,${vh - 100})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .call(g => g.selectAll(".domain").remove())
        .style("font-family", "Open Sans")
        .style("font-size", "15px");

    // y axis
    g.append("g")
        .attr("transform", `translate(${vw / 3 - barSpanLength / 2},0)`)
        .call(d3.axisLeft(y).ticks(null, "s"))
        .call(g => g.selectAll(".domain").remove())
        .style("font-family", "Open Sans")
        .style("font-size", "15px")
        .append("text")
        .text("Assignable Area (sq ft)")
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(-60, ${vh / 2}) rotate(-90)`);

    // title
    g.append("text")
        .text(
            "What do " +
                args.predicates.layer0["AND"][1]["=="][1] +
                " folks use rooms for in Building " +
                args.predicates.layer0["AND"][0]["=="][1] +
                "?"
        )
        .style("font-family", "Open Sans")
        .style("font-size", 23)
        .attr("x", 600)
        .attr("y", 100)
        .call(params.textwrap, 350);

    // legend
    var allColors = [];
    for (var i = 0; i < minorUses.length; i++) allColors.push(colors[i % 12]);
    var colorScale = d3.scaleOrdinal(minorUses, allColors);
    var legendOrdinal = d3
        .legendColor()
        .shape("rect")
        .shapePadding(5)
        .labelOffset(13)
        .scale(colorScale);

    var legendG = g.append("g").attr("transform", "translate(700, 200)");
    legendG
        .append("g")
        .attr("transform", "translate(0, 20) scale(1.3)")
        .call(legendOrdinal);
};

var courseBarChartRendering = function(svg, data, args) {
    // aggregate by department_name
    var aggDataDict = {};
    var maxUnits = 1;
    for (var i = 0; i < data.length; i++) {
        var deptName = data[i].department_name;
        if (!(deptName in aggDataDict))
            aggDataDict[deptName] = {
                total_units: 0,
                class_count: 0,
                code: data[i].department_code
            };
        aggDataDict[deptName].total_units += +data[i].total_units;
        aggDataDict[deptName].class_count++;
        maxUnits = Math.max(maxUnits, aggDataDict[deptName].total_units);
    }

    // aggData array, for d3
    var aggData = [];
    var deptNames = Object.keys(aggDataDict);
    for (var i = 0; i < deptNames.length; i++)
        aggData.push({
            name: deptNames[i],
            dept_code: aggDataDict[deptNames[i]].code,
            totalUnits: aggDataDict[deptNames[i]].total_units,
            class_count: aggDataDict[deptNames[i]].class_count
        });

    // create names and bars
    var g = svg.append("g");
    var pixelYPerDept = 30;
    var namePixel = 200;
    var startY = args.viewportH / 2 - (pixelYPerDept * deptNames.length) / 2;
    var color = d3.scaleSequential(d3.interpolateGnBu).domain([0, maxUnits]);

    // title
    g.append("text")
        .text(
            `What departments use room ${
                args.predicates.layer0["=="][1]
            } for teaching?`
        )
        .style("font-family", "Open Sans")
        .style("font-size", 23)
        .attr("x", 15)
        .attr("y", 20);

    // names
    g.selectAll(".deptnames")
        .data(aggData)
        .join("text")
        .text(d =>
            d.name.length < 20 ? d.name : d.name.substring(0, 18) + "..."
        )
        .attr("x", 20)
        .attr("y", (d, i) => startY + pixelYPerDept * i)
        .attr("font-size", 18)
        .attr("dy", ".35em")
        .attr("font-family", "Open Sans");

    // bars
    g.selectAll(".bar")
        .data(aggData)
        .join("rect")
        .attr(
            "width",
            d => ((args.viewportH - namePixel - 100) * d.totalUnits) / maxUnits
        )
        .attr("height", pixelYPerDept - 5)
        .attr("x", namePixel + 5)
        .attr("y", (d, i) => startY + pixelYPerDept * i - pixelYPerDept / 2)
        .attr("fill", d => color(d.totalUnits));

    // x axis
    var x = d3
        .scaleLinear()
        .domain([0, maxUnits])
        .range([namePixel + 5, args.viewportH - 100]);

    var axesg = g
        .append("g")
        .attr(
            "transform",
            `translate(0, ${startY + pixelYPerDept * aggData.length})`
        )
        .call(
            d3
                .axisBottom(x)
                .ticks(null, "s")
                .tickSize(-pixelYPerDept * aggData.length - 20)
        )
        .style("font-family", "Open Sans")
        .style("font-size", "15px");

    axesg
        .append("text")
        .text("Total Units")
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr(
            "transform",
            `translate(${namePixel +
                5 +
                (args.viewportH - namePixel - 100) / 2}, 40)`
        );

    axesg
        .selectAll(".tick line")
        .attr("stroke", "#CCC")
        .attr("stroke-dasharray", "5, 5")
        .style("opacity", 0.3);
    axesg.attr("font-family", "Open Sans").attr("font-size", "13");
    axesg
        .selectAll("g")
        .selectAll("text")
        .style("fill", "#999");
    axesg.selectAll("path").remove();
};

module.exports = {
    renderingParams,
    buildingCircleRendering,
    buildingLegendRendering,
    roomBarChartRendering,
    courseBarChartRendering
};
