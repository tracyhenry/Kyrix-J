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

module.exports = {
    renderingParams,
    buildingCircleRendering,
    buildingLegendRendering
};
