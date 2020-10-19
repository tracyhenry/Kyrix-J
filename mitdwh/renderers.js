var renderingParams = {
    maxBuildingHeight: 275,
    maxCircleRadius: 15,
    textwrap: require("../../src/template-api/Utilities").textwrap
};

var buildingCircleRendering = function (svg, data, args) {

    g = svg.append("g");
    var params = args.renderingParams;
    var circleRadiusScale = d3.scaleLinear()
        .domain([0, params.maxBuildingHeight]).range([0, params.maxCircleRadius]);
    var circleColorScale = d3.scaleOrdinal(["RESIDENT", "ACADEMIC", "SERVICE"], d3.schemeTableau10);

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

var buildingLegendRendering = function (svg, data, args) {

    var params = args.renderingParams;
    var radiusScale = d3.scaleLinear()
        .domain([0, params.maxBuildingHeight]).range([0, params.maxCircleRadius]);
    var colorScale = d3.scaleOrdinal(["RESIDENT", "ACADEMIC", "SERVICE"], d3.schemeTableau10);
    var legendOrdinal = d3
        .legendColor()
        .shape("rect")
        .shapePadding(5)
        .title("Building Type")
        .labelOffset(13)
        .scale(colorScale);

    var legendG = svg.append("g").classed("building_legend", true)
        .style("opacity", 0.5)
        .attr("transform", "translate(50, 0)");
    legendG.append("g").attr("transform", "translate(0, 20) scale(1)").call(legendOrdinal);

    var legendSize = d3.legendSize()
        .scale(radiusScale)
        .shape('circle')
        .shapePadding(25)
        .labelOffset(20)
        .title("Building Height (ft)")
        .orient('horizontal');
    legendG.append("g").attr("transform", "translate(120, 20)").call(legendSize);
    legendG.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", legendG.node().getBBox().width)
        .attr("height", legendG.node().getBBox().height)
        .style("opacity", 0)
        .on("mouseover", function() {
            d3.selectAll(".building_legend")
                .style("opacity", 1);

        })
        .on("mouseout", function () {
            d3.selectAll(".building_legend")
                .style("opacity", 0.5);
        })
}

var roomTreeMapRendering = function (svg, data, args) {

    // perform aggregation
    var aggData = {};
    for (var i = 0; i < data.length; i ++) {
        var orgName = data[i].organization_name;
        if (! (orgName in aggData))
            aggData[orgName] = {area: 0, bldg_key: ""};
        aggData[orgName].area += isNaN(data[i].area.replace(/,/g, '')) ? 0 : +data[i].area.replace(/,/g, '');
        aggData[orgName].bldg_key = data[i].fclt_building_key;
    }

    // construct data needed to pass in d3.treemap
    var treemapData = {children: []};
    var orgNames = Object.keys(aggData);
    for (var i = 0; i < orgNames.length; i ++) {
        var orgName = orgNames[i];
        treemapData.children.push({area: aggData[orgName].area,
            orgName: orgName,
            building_key: aggData[orgName].bldg_key});
    }

    // use d3.treemap to calculate coordinates
    var ysft= 40;
    var root = d3.treemap()
        .size([args.viewportW, args.viewportH - ysft])
        .padding(3)
        .round(true)
        (d3.hierarchy(treemapData)
            .sum(d => d.area)
        .sort((a, b) => b.data.area - a.data.area));

    // color scale
    var areas = root.leaves().map(d => d.data.area);
    var minArea = d3.min(areas);
    var maxArea = d3.max(areas);
    var color = d3
        .scaleSequential(d3.interpolateGnBu)
        .domain([0, maxArea]);

    // draw rectangles
    var bindingData = root.leaves().map(function (d) {
        var ret = {x0 : d.x0, y0: d.y0, x1: d.x1, y1:d.y1};
        var keys = Object.keys(d.data);
        for (var i = 0; i < keys.length; i ++)
            ret[keys[i]] = d.data[keys[i]];
        return ret;
    })
    var g = svg.append("g");
    g.selectAll(".treemaprect")
        .data(bindingData)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0 + ysft)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => color(d.area));

    // organization names
    g.selectAll(".orgnametext")
        .data(bindingData)
        .join("text")
        .text(d => d.orgName)
        .attr("text-anchor", "left")
        .attr("x", d => d.x0 + 10)
        .attr("y", d => d.y0 + 30 + ysft)
        .attr("font-size", 15)
        .attr("font-family", "Open Sans")
        .attr("fill", function (d) {
            if (minArea == maxArea)
                 return "#000";
            if (d.area / (maxArea - minArea) > 0.7)
                return "#FFF";
            return "#000";
        })
        .style("opacity", function (d) {
            var w = d.x1 - d.x0;
            var h = d.y1 - d.y0;
            if (w > d.orgName.length * 11 && h > 40)
                return 1;
            else
                return 0;
        });

    // title
    g.append("text")
        .text(`What organizations in Building ${args.predicates.layer0["=="][1]} occupy the largest area?`)
        .style("font-family", "Open Sans")
        .style("font-size", 23)
        .attr("x", 15)
        .attr("y", 20);
}

var roomBarChartRendering = function (svg, data, args) {

    var g = svg.append("g");
    var params = args.renderingParams;

    // aggregate data by major use and minor use
    var minorUseMap = {};
    var agg = {};
    for (var i = 0; i < data.length; i ++) {
        var majorUse = data[i].major_use_desc;
        var minorUse = data[i].use_desc;
        minorUseMap[minorUse] = true;
        // create keys
        if (! (majorUse in agg))
            agg[majorUse] = {};
        if (! (minorUse in agg[majorUse]))
            agg[majorUse][minorUse] = 0;
        // aggregate
        agg[majorUse][minorUse] += isNaN(data[i].area.replace(/,/g, '')) ? 0 : +data[i].area.replace(/,/g, '');
    }

    // set up scales
    var majorUses = Object.keys(agg);
    var minorUses = Object.keys(minorUseMap);
    var vw = args.viewportW;
    var vh = args.viewportH;
    var barSpanLength = majorUses.length * 80;
    var x = d3.scaleBand()
        .domain(majorUses)
        .range([vw / 3 - barSpanLength / 2, vw / 3 + barSpanLength / 2])
        .padding(0.2);
    var y = d3.scaleLinear()
        .domain([0, d3.max(majorUses.map(d => d3.sum(minorUses.map(p => (p in agg[d] ? agg[d][p] : 0)))))])
        .range([vh - 100, 100]);
    var colors = d3.schemePaired;

    // append rectangles
    for (var i = 0; i < majorUses.length; i ++) {
        var majorUse = majorUses[i];
        var curH = 0;
        for (var j = 0; j < minorUses.length; j ++) {
            var minorUse = minorUses[j];
            if (! (minorUse in agg[majorUse]))
                continue;
            var curArea = agg[majorUse][minorUse];
            curH += curArea;
            g.append("rect")
                .datum({major_use: majorUse, minor_use: minorUse, area: curArea})
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
        .attr(
            "transform",
            `translate(-60, ${vh / 2}) rotate(-90)`
        );

    // title
    g.append("text")
        .text("What do " + args.predicates.layer0["AND"][1]["=="][1] + " folks use rooms for in Building " + args.predicates.layer0["AND"][0]["=="][1] + "?")
        .style("font-family", "Open Sans")
        .style("font-size", 23)
        .attr("x", 600)
        .attr("y", 100)
        .call(params.textwrap, 350);

    // legend
    var allColors = [];
    for (var i = 0; i < minorUses.length; i ++)
        allColors.push(colors[i % 12]);
    var colorScale = d3.scaleOrdinal(minorUses, allColors);
    var legendOrdinal = d3
        .legendColor()
        .shape("rect")
        .shapePadding(5)
        .labelOffset(13)
        .scale(colorScale);

    var legendG = g.append("g")
        .attr("transform", "translate(700, 200)");
    legendG.append("g").attr("transform", "translate(0, 20) scale(1.3)").call(legendOrdinal);

}

var roomCirclePackRendering = function (svg, data, args) {

    // construct data needed to pass in d3.pack
    data.forEach(function (d) {
        if (d == null) return;
        if (typeof d.area == "number") return;
        if (d.area == null || isNaN(d.area.replace(/,/g, '')))
            d.area = 0;
        else
            d.area = +d.area.replace(/,/g, '');
    });
    var packData = {children: data};

    // use d3.treemap to calculate coordinates
    var ysft= 40;
    var root = d3.pack()
        .size([args.viewportW, args.viewportH - ysft])
        .padding(3)
        (d3.hierarchy(packData)
            .sum(d => d.area));

    // color scale
    var areas = root.leaves().map(d => d.data.area);
    var maxArea = d3.max(areas);
    var color = d3
        .scaleSequential(d3.interpolateGnBu)
        .domain([0, maxArea]);

    // draw circles
    var bindingData = root.leaves().map(function (d) {
        var ret = {x : d.x, y: d.y, r: d.r};
        var keys = Object.keys(d.data);
        for (var i = 0; i < keys.length; i ++)
            ret[keys[i]] = d.data[keys[i]];
        return ret;
    });
    var g = svg.append("g");
    g.selectAll(".packcircle")
        .data(bindingData)
        .join("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y + ysft)
        .attr("r", d => d.r)
        .attr("fill", d => color(d.area));

    // title
    g.append("text")
        .text(`${args.predicates.layer0["AND"][1]["=="][1]} rooms in Building ${args.predicates.layer0["AND"][0]["AND"][0]["=="][1]} used by ${args.predicates.layer0["AND"][0]["AND"][1]["=="][1]} folks`)
        .style("font-family", "Open Sans")
        .style("font-size", 23)
        .attr("x", 15)
        .attr("y", 20);
};

var courseBarChartRendering = function (svg, data, args) {

    // aggregate by department_name
    var aggDataDict = {};
    var maxUnits = 1;
    for (var i = 0; i < data.length; i ++) {
        var deptName = data[i].department_name;
        if (! (deptName in aggDataDict))
            aggDataDict[deptName] = {total_units: 0, class_count: 0, code: data[i].department_code};
        aggDataDict[deptName].total_units += +data[i].total_units;
        aggDataDict[deptName].class_count ++;
        maxUnits = Math.max(maxUnits, aggDataDict[deptName].total_units);
    }

    // aggData array, for d3
    var aggData = [];
    var deptNames = Object.keys(aggDataDict);
    for (var i = 0; i < deptNames.length; i ++)
        aggData.push({name: deptNames[i],
            dept_code: aggDataDict[deptNames[i]].code,
            totalUnits: aggDataDict[deptNames[i]].total_units,
            class_count: aggDataDict[deptNames[i]].class_count});

    // create names and bars
    var g = svg.append("g");
    var pixelYPerDept = 30;
    var namePixel = 200;
    var startY = args.viewportH / 2 - pixelYPerDept * deptNames.length  / 2;
    var color = d3
        .scaleSequential(d3.interpolateGnBu)
        .domain([0, maxUnits]);

    // title
    g.append("text")
        .text(`What departments use room ${args.predicates.layer0["=="][1]} for teaching?`)
        .style("font-family", "Open Sans")
        .style("font-size", 23)
        .attr("x", 15)
        .attr("y", 20);

    // names
    g.selectAll(".deptnames")
        .data(aggData)
        .join("text")
        .text(d => (d.name.length < 20 ? d.name : d.name.substring(0, 18) + "..."))
        .attr("x", 20)
        .attr("y", (d, i) => startY + pixelYPerDept * i)
        .attr("font-size", 18)
        .attr("dy", ".35em")
        .attr("font-family", "Open Sans");

    // bars
    g.selectAll(".bar")
        .data(aggData)
        .join("rect")
        .attr("width", d => (args.viewportH - namePixel - 100) * d.totalUnits / maxUnits)
        .attr("height", pixelYPerDept - 5)
        .attr("x", namePixel + 5)
        .attr("y", (d, i) => (startY + pixelYPerDept * i - pixelYPerDept / 2))
        .attr("fill", d => color(d.totalUnits));

    // x axis
    var x = d3.scaleLinear()
        .domain([0, maxUnits])
        .range([namePixel + 5, args.viewportH - 100]);

    var axesg = g.append("g")
        .attr("transform", `translate(0, ${startY + pixelYPerDept * aggData.length})`)
        .call(d3.axisBottom(x).ticks(null, "s").tickSize(-pixelYPerDept * aggData.length - 20))
        .style("font-family", "Open Sans")
        .style("font-size", "15px");

    axesg.append("text")
        .text("Total Units")
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${namePixel + 5 + (args.viewportH - namePixel - 100) / 2}, 40)`);

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

var studentPieChartRendering = function (svg, data, args) {

    // aggregate by department_name
    var aggDataDict = {};
    var maxCount = 1;
    for (var i = 0; i < data.length; i ++) {
        var year = data[i].student_year;
        if (! (year in aggDataDict))
            aggDataDict[year] = {count: 0};
        aggDataDict[year].count ++;
        maxCount = Math.max(maxCount, aggDataDict[year].count);
    }

    // aggData array, for d3
    var aggData = [];
    var years = ["1", "2", "3", "4", "G"];
    for (var i = 0; i < years.length; i ++)
        aggData.push({year: years[i], count: ((years[i] in aggDataDict) ? aggDataDict[years[i]].count : 0)});

    // create pie
    var g = svg.append("g");
    var pie = d3.pie()
        .sort(null)
        .value(d => d.count);
    var color = d3.scaleOrdinal()
        .domain(years)
        .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), years.length).reverse())
    var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(300);
    var arcs = pie(aggData);
    arcs.forEach(function(d) {
        d.year = d.data.year;
        d.count = d.data.count;
    });
    g.selectAll("path")
        .data(arcs)
        .join("path")
        .attr("fill", d => color(d.year))
        .attr("d", arc)
        .attr("transform", `translate(${args.viewportW / 2}, ${args.viewportH / 2})`)

    // title
    var title = g.append("text");
    if (args.predicates.layer0["=="][0] == "department")
        title.text(`Student year distribution in course ${args.predicates.layer0["=="][1]}`);
    else
        title.text(`Student year distribution in room ${args.predicates.layer0["=="][1]}`);

    title.style("font-family", "Open Sans")
        .style("font-size", 23)
        .attr("x", 15)
        .attr("y", 20);
};

var graphRendering = function(svg, data, args) {
};

module.exports = {
    renderingParams,
    buildingCircleRendering,
    buildingLegendRendering,
    roomTreeMapRendering,
    roomBarChartRendering,
    roomCirclePackRendering,
    courseBarChartRendering,
    studentPieChartRendering,
    graphRendering
};
