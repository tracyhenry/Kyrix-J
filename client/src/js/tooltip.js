// function makeTooltips(selection, columns, aliases) {
//     var createTooltip = function(d) {
//         if (d == null || typeof d !== "object") return;
//         // remove all tool tips first
//         d3.select("body")
//             .selectAll(".kyrixtooltip")
//             .remove();
//         // create a new tooltip
//         var tooltip = d3
//             .select("body")
//             .append("table")
//             .classed("kyrixtooltip", true)
//             .style("background", "#FFF")
//             .style("border-radius", "3px")
//             .style("position", "absolute")
//             .style("box-shadow", "2px 2px #888888")
//             .style("pointer-events", "none")
//             .style("opacity", 0)
//             .style("font-size", "13px")
//             .style("font-family", "Open Sans")
//             .style("left", d3.event.pageX + "px")
//             .style("top", d3.event.pageY + "px");
//         var rows = tooltip
//             .selectAll(".kyrix-tooltip-rows")
//             .data(columns)
//             .join("tr");
//         // column names
//         rows.append("td")
//             .html((p, j) => aliases[j] + ":")
//             .style("padding-left", "10px")
//             .style("padding-right", "2px")
//             .style("padding-top", (p, i) => (i == 0 ? "10px" : "1px"))
//             .style("padding-bottom", (p, i) =>
//                 i == columns.length - 1 ? "10px" : "1px"
//             );
//
//         // column values
//         rows.append("td")
//             .html(p => (!isNaN(d[p]) ? d3.format("~s")(d[p]) : d[p]))
//             .style("font-weight", "900")
//             .style("padding-left", "2px")
//             .style("padding-right", "10px")
//             .style("padding-top", (p, i) => (i == 0 ? "10px" : "1px"))
//             .style("padding-bottom", (p, i) =>
//                 i == columns.length - 1 ? "10px" : "1px"
//             );
//
//         // fade in
//         tooltip
//             .transition()
//             .duration(200)
//             .style("opacity", 0.9);
//     };
//
//     selection
//         .on("mouseover.kyrixtooltip", d => createTooltip(d))
//         .on("mousemove.kyrixtooltip", function(d) {
//             if (d == null || typeof d !== "object") return;
//             d3.select(".kyrixtooltip")
//                 .style("left", d3.event.pageX + "px")
//                 .style("top", d3.event.pageY + "px");
//         })
//         .on("mouseout.kyrixtooltip", function(d) {
//             if (d == null || typeof d !== "object") return;
//             d3.select(".kyrixtooltip").remove();
//         });
// }
