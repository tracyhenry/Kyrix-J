import * as d3 from "d3";

const resizeSvgs = () => {
    var divs = d3.selectAll(".grid-container > .erdiagram").nodes();
    for (var i = divs.length - 1; i >= 0; i--) {
        var div = divs[i];

        // maximum space allowed in the div
        var bbox = div.getBoundingClientRect();
        var maxW = bbox.width;
        var maxH = bbox.height;

        // maximum space according to the ratio of container svg
        // get svg size
        var svg = d3.select(div).select("svg:first-of-type");
        if (svg.node() == null) continue;
        var svgW = svg.attr("width");
        var svgH = svg.attr("height");

        var realW = Math.min(maxW, (maxH * svgW) / svgH);
        var realH = (realW * svgH) / svgW;

        // set viewbox accordingly
        var minx = (-svgW * (bbox.width / 2 - realW / 2)) / realW;
        var miny = (-svgH * (bbox.height / 2 - realH / 2)) / realH;
        svg.attr(
            "viewBox",
            minx +
                " " +
                miny +
                " " +
                +(svgW * svgW) / realW +
                " " +
                (svgH * svgH) / realH
        );
    }
};

const resizeRawDataTable = that => {
    that.setState({
        rawDataTableMaxHeight: getRawDataTableMaxHeight()
    });
};

const getRawDataTableMaxHeight = () => {
    if (d3.select(".rawdata .ant-card-body").empty()) return 200;
    return Math.max(
        d3
            .select(".rawdata .ant-card-body")
            .node()
            .getBoundingClientRect().height - 100,
        50
    );
};

export {resizeSvgs, getRawDataTableMaxHeight, resizeRawDataTable};
