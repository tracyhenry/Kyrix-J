function resizeSvgs() {
    // Update all elements of class kyrixdiv
    var divs = d3.selectAll(".grid-container > div:not(.kyrixdiv)").nodes();
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
        svg.attr(
            "viewBox",
            "0 0 " + (svgW * svgW) / realW + " " + (svgH * svgH) / realH
        );

        // center
        svg.style("left", bbox.width / 2 - realW / 2).style(
            "top",
            bbox.height / 2 - realH / 2
        );
    }
}

$(document).ready(resizeSvgs());
window.onresize = function() {
    resizeSvgs();
};
