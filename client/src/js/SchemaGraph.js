import React, {Component} from "react";
import * as d3 from "d3";

class SchemaGraph extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.svgRef = React.createRef();
    }

    componentDidMount = () => {
        this.renderSvgGraph();
    };

    componentDidUpdate = () => {
        this.renderSvgGraph();
    };

    renderSvgGraph = () => {
        var graphMainSvg = d3.select(this.svgRef.current);

        // tables
        var tables = ["building", "room", "course", "student"];
        var canvasIdToTable = {
            ssv0_level0: "building",
            ssv0_level1: "building",
            ssv0_level2: "building",
            ssv0_level3: "building",
            room_treemap: "room",
            room_barchart: "room",
            room_circlepack: "room",
            course_bar: "course",
            student_pie: "student"
        };

        // initial superman location
        var curTable = "building";
        var supermanW = 36;
        var supermanH = 28;
        var circleRadius = 30;

        var g = graphMainSvg.append("g");
        var nodeData = [
            {table_name: "building", numCanvas: 1, numRecords: 228},
            {table_name: "room", numCanvas: 3, numRecords: 40546},
            {
                table_name: "course",
                numCanvas: 1,
                numRecords: 255976
            },
            {table_name: "student", numCanvas: 1, numRecords: 11447}
        ];
        var linkData = [
            {source: "building", target: "room"},
            {source: "room", target: "course"},
            {source: "course", target: "student"},
            {source: "room", target: "student"}
        ];

        var links = g
            .selectAll("line")
            .data(linkData)
            .join("line")
            .style("stroke", "#eee")
            .style("stroke-width", 2);
        var nodes = g
            .selectAll("circle")
            .data(nodeData)
            .join("circle")
            .attr("r", circleRadius)
            .style("fill", "#ADD8E6")
            .style("stroke", "#eee")
            .style("stroke-width", 3);

        this.makeTooltips(
            nodes,
            ["table_name", "numRecords", "numCanvas"],
            ["Table", "# of Records", "# of vis"]
        );
        var simulation = d3
            .forceSimulation()
            .force("link", d3.forceLink().id(d => d.table_name))
            .force("charge", d3.forceManyBody().strength(-8000))
            .force(
                "center",
                d3.forceCenter(this.props.width / 2, this.props.height / 2)
            )
            .nodes(nodeData)
            .on("tick", function() {
                links
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);
                nodes.attr("cx", d => d.x).attr("cy", d => d.y);
                var curNode = nodes.filter(d =>
                    d.table_name === curTable ? true : false
                );
                d3.select("#supermanlogo")
                    .attr("x", curNode.attr("cx") - supermanW / 2)
                    .attr("y", curNode.attr("cy") - supermanH / 2);
            });

        simulation.force("link").links(linkData);

        g.append("image")
            .attr("id", "supermanlogo")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", supermanW)
            .attr("height", supermanH)
            .attr(
                "xlink:href",
                "https://upload.wikimedia.org/wikipedia/commons/0/05/Superman_S_symbol.svg"
            );
        /*
        kyrix.on("jumpstart.switch", "ssv0", function(jump) {
            // get source and dest coordinates
            var startTable =
                canvasIdToTable[jump.backspace ? jump.destId : jump.sourceId];
            var startNode = nodes.filter(d =>
                d.table_name == startTable ? true : false
            );
            var startCx = startNode.attr("cx");
            var startCy = startNode.attr("cy");

            var endTable =
                canvasIdToTable[jump.backspace ? jump.sourceId : jump.destId];
            var endNode = nodes.filter(d => (d.table_name == endTable ? true : false));
            var endCx = endNode.attr("cx");
            var endCy = endNode.attr("cy");

            // change jump's slide direction
            var disX = endCx - startCx;
            var disY = endCy - startCy;
            var dir =
                (Math.acos(disX / Math.sqrt(disX * disX + disY * disY)) / Math.PI) *
                180;
            if (endCy < startCy) dir = 360 - dir;
            jump.slideDirection = 360 - dir;

            // animate the logo
            d3.select("#supermanlogo")
                .transition()
                .ease(d3.easeLinear)
                .duration(2700)
                .attr("x", endCx - supermanW / 2)
                .attr("y", endCy - supermanH / 2)
                .on("end", function() {
                    curTable = endTable;
                });
        });

        kyrix.on("jumpstart.zoom", "ssv0", function(jump) {
            if (jump.type != "semantic_zoom") return;
            var currentNode = nodes.filter(d =>
                d.table_name == curTable ? true : false
            );
            var arrowG = g
                .append("g")
                .attr("id", "arrowG")
                .attr(
                    "transform",
                    `translate(${+currentNode.attr("cx") +
                    circleRadius}, ${+currentNode.attr("cy") +
                    (jump.backspace
                        ? circleRadius - 10
                        : -circleRadius + 10)}) scale(0.04, ${
                        jump.backspace ? -0.04 : 0.04
                        })`
                );
            arrowG
                .append("path")
                .attr(
                    "d",
                    "M1010.81001246 56.6447675c8.13102537-10.31546098 7.28974996-25.0705531-1.95511535-34.39404215-9.24748529-9.32741999-23.99471553-10.29580432-34.37962739-2.25650648L661.20604861 333.26081902 347.93944847 19.99290792a25.36932426 25.36932426 0 0 0-36.9663555 0 31.35260638 31.35260638 0 0 0-7.82963326 18.48317774 31.33032877 31.33032877 0 0 0 7.82963326 18.16737184l331.75108886 331.12471705a25.36932426 25.36932426 0 0 0 36.96635453 0L1010.81001246 56.6447675z m0 0"
                )
                .attr("fill", "#d81e06");
            arrowG
                .append("path")
                .attr(
                    "d",
                    "M1060.30902307 306.94800705c10.20669774-11.8027639 9.56853309-29.48528762-1.46371531-40.51622603-11.03093841-11.03093841-28.71215214-11.67041306-40.51622604-1.46240436l-357.12303311 357.12172215-357.12565405-357.12172215a29.12492746 29.12492746 0 0 0-41.9760104 0 32.88839353 32.88839353 0 0 0-8.77050002 20.9886602 31.32639783 31.32639783 0 0 0 8.77050002 20.98997019l378.11300426 378.11169427a29.13803126 29.13803126 0 0 0 41.97863136 0l378.11300329-378.11169427z m0 0"
                )
                .attr("fill", "#d81e06");
            arrowG
                .append("path")
                .attr(
                    "d",
                    "M1110.50385639 567.09365422c11.488268-13.28613491 10.76885866-33.18716468-1.6484823-45.60450564-12.41602999-12.41602999-32.31574882-13.13412935-45.60188468-1.64455039l-401.95178135 401.95178135-401.95702422-401.95178135a32.7848722 32.7848722 0 0 0-47.24512412 0 37.02794352 37.02794352 0 0 0-9.87254614 23.62387253 35.25759515 35.25759515 0 0 0 9.87254614 23.62387253l425.57827484 425.57696484a32.79404505 32.79404505 0 0 0 47.24774603 0l425.5782758-425.57565387z m0 0"
                )
                .attr("fill", "#d81e06");

            // a cover-up rectangle
            var coverRect = g
                .append("rect")
                .attr("id", "coverrect")
                .attr("x", +currentNode.attr("cx") + circleRadius + 5)
                .attr("y", +currentNode.attr("cy") - circleRadius)
                .attr("width", 50)
                .attr("height", circleRadius * 2)
                .attr("fill", "white");
            var duration = 700;
            function repeat() {
                if (jump.backspace)
                    coverRect
                        .transition()
                        .duration(duration)
                        .attr("height", 0)
                        .on("end", function() {
                            coverRect.attr("height", circleRadius * 2);
                            repeat();
                        });
                else
                    coverRect
                        .transition()
                        .duration(duration)
                        .attr("y", +currentNode.attr("cy") + circleRadius)
                        .on("end", function() {
                            coverRect.attr("y", +currentNode.attr("cy") - circleRadius);
                            repeat();
                        });
            }
            repeat();
        });

        kyrix.on("jumpend.zoom", "ssv0", function(jump) {
            if (jump.type != "semantic_zoom") return;
            var coverRect = d3.select("#coverrect");
            if (coverRect.empty()) return;
            coverRect.interrupt();
            coverRect.remove();
            d3.select("#arrowG").remove();
        });
*/
    };

    makeTooltips = (selection, columns, aliases) => {
        var createTooltip = d => {
            if (d == null || typeof d !== "object") return;
            // remove all tool tips first
            d3.select("body")
                .selectAll(".kyrixtooltip")
                .remove();
            // create a new tooltip
            var tooltip = d3
                .select("body")
                .append("table")
                .classed("kyrixtooltip", true)
                .style("background", "#FFF")
                .style("border-radius", "3px")
                .style("position", "absolute")
                .style("box-shadow", "2px 2px #888888")
                .style("pointer-events", "none")
                .style("opacity", 0)
                .style("font-size", "13px")
                .style("font-family", "Open Sans")
                .style("left", d3.event.pageX + "px")
                .style("top", d3.event.pageY + "px");
            var rows = tooltip
                .selectAll(".kyrix-tooltip-rows")
                .data(columns)
                .join("tr");
            // column names
            rows.append("td")
                .html((p, j) => aliases[j] + ":")
                .style("padding-left", "10px")
                .style("padding-right", "2px")
                .style("padding-top", (p, i) => (i == 0 ? "10px" : "1px"))
                .style("padding-bottom", (p, i) =>
                    i == columns.length - 1 ? "10px" : "1px"
                );

            // column values
            rows.append("td")
                .html(p => (!isNaN(d[p]) ? d3.format("~s")(d[p]) : d[p]))
                .style("font-weight", "900")
                .style("padding-left", "2px")
                .style("padding-right", "10px")
                .style("padding-top", (p, i) => (i == 0 ? "10px" : "1px"))
                .style("padding-bottom", (p, i) =>
                    i == columns.length - 1 ? "10px" : "1px"
                );

            // fade in
            tooltip
                .transition()
                .duration(200)
                .style("opacity", 0.9);
        };

        selection
            .on("mouseover.kyrixtooltip", d => createTooltip(d))
            .on("mousemove.kyrixtooltip", function(d) {
                if (d == null || typeof d !== "object") return;
                d3.select(".kyrixtooltip")
                    .style("left", d3.event.pageX + "px")
                    .style("top", d3.event.pageY + "px");
            })
            .on("mouseout.kyrixtooltip", function(d) {
                if (d == null || typeof d !== "object") return;
                d3.select(".kyrixtooltip").remove();
            });
    };

    render() {
        return (
            <div className="erdiagram svgdiv">
                <svg
                    className="erdiagramsvgwidth"
                    width={this.props.width}
                    height={this.props.height}
                    ref={this.svgRef}
                ></svg>
                <div className="explain">Schema Graph View</div>
            </div>
        );
    }
}

export default SchemaGraph;
