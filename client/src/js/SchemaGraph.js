import React, {Component} from "react";
import * as d3 from "d3";
import resizeSvgs from "../js/ResizeSvgs";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";

class SchemaGraph extends Component {
    constructor(props) {
        super(props);
        this.state = {};

        // svg for D3
        this.svgRef = React.createRef();

        // initialize D3 force directed layout
        this.supermanW = 48;
        this.supermanH = 36;
        this.circleRadius = 40;
        let tickFunction = () => {
            this.nodes.attr("cx", d => d.x).attr("cy", d => d.y);
            this.links
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            var curNode = this.nodes.filter(d =>
                d.table_name === this.props.curTable ? true : false
            );
            d3.select("#supermanlogo")
                .attr("x", curNode.attr("cx") - this.supermanW / 2)
                .attr("y", curNode.attr("cy") - this.supermanH / 2);
        };
        let endFunction = () => {
            if (this.nodes) {
                this.nodes.each(d => {
                    d.fx = d.x;
                    d.fy = d.y;
                });
                let newStuff = d3.selectAll(".graphnew");
                if (newStuff.size() == 0)
                    d3.select("body").style("pointer-events", "auto");
                else
                    newStuff
                        .transition()
                        .duration(500)
                        .style("stroke", "#111")
                        .transition()
                        .duration(500)
                        .style("stroke", "#eee")
                        .on("end", (d, i, nodes) => {
                            if (i == 0) {
                                d3.selectAll(nodes).classed("graphnew", false);
                                d3.select("body").style(
                                    "pointer-events",
                                    "auto"
                                );
                            }
                        });
            }
        };
        this.simulation = d3
            .forceSimulation()
            .force("link", d3.forceLink().id(d => d.table_name))
            .force("charge", d3.forceManyBody().strength(-8000))
            .force(
                "center",
                d3.forceCenter(this.props.width / 2, this.props.height / 2)
            )
            .on("tick", tickFunction.bind(this))
            .on("end", endFunction.bind(this))
            .stop();
    }

    componentDidMount = () => {
        if (!this.props.kyrixLoaded) return;
        this.renderNewTable();
    };

    componentDidUpdate = () => {
        if (!this.props.kyrixLoaded) return;

        if (
            this.props.newTableType === "tableDetailsClick" ||
            this.props.newTableType === "kyrixLoaded"
        )
            this.renderNewTable();
        else this.renderNewNeighbors();
    };

    //shouldComponentUpdate = nextProps => this.props.curTable.length === 0;

    getOneHopNeighbors = () => {
        let nodes = [];
        let links = [];
        const edges = this.props.graphEdges;
        for (let i = 0; i < edges.length; i++) {
            let neighbor = "";
            if (edges[i].source === this.props.curTable)
                neighbor = edges[i].target;
            if (edges[i].target === this.props.curTable)
                neighbor = edges[i].source;
            if (neighbor.length === 0) continue;
            nodes.push({
                table_name: neighbor,
                numCanvas: this.props.tableMetadata[neighbor].numCanvas,
                numRecords: this.props.tableMetadata[neighbor].numRecords
            });
            links.push({source: this.props.curTable, target: neighbor});
        }
        const ret = {
            nodeData: nodes,
            linkData: links
        };

        return ret;
    };

    renderNewNeighbors = () => {
        let nodeData = [...this.nodes.data()];
        let linkData = [...this.links.data()];
        let oldNodeCount = this.nodes.data().length;
        let oldLinkCount = this.links.data().length;
        let neighbors = this.getOneHopNeighbors();
        for (let i = 0; i < neighbors.nodeData.length; i++) {
            let neighborTableName = neighbors.nodeData[i].table_name;
            // node
            let exist =
                nodeData.filter(d => d.table_name === neighborTableName)
                    .length > 0;
            if (!exist) nodeData.push(neighbors.nodeData[i]);
            // link
            exist =
                linkData.filter(
                    d =>
                        (d.source.table_name === this.props.curTable &&
                            d.target.table_name === neighborTableName) ||
                        (d.target.table_name === this.props.curTable &&
                            d.source.table_name === neighborTableName)
                ).length > 0;
            if (!exist)
                linkData.push({
                    source: this.props.curTable,
                    target: neighborTableName
                });
        }

        // update selections
        let graphMainSvg = d3.select(this.svgRef.current);
        this.nodes = this.nodes.data(nodeData).join(enter => {
            enter
                .append("circle")
                .attr("r", this.circleRadius)
                .call(
                    this.makeTooltips,
                    ["table_name", "numRecords", "numCanvas"],
                    ["Table", "# of Records", "# of vis"]
                )
                .style("cursor", "pointer")
                .classed("graphnew", true)
                .on("click", this.props.handleNodeClick);
        });
        this.nodes = graphMainSvg.select(".circleg").selectAll("circle");

        this.links = this.links.data(linkData).join(enter => {
            enter.append("line").classed("graphnew", true);
        });
        this.links = graphMainSvg.select(".lineg").selectAll("line");

        // update and restart simulation
        this.simulation.nodes(nodeData);
        this.simulation.force("link").links(linkData);
        let alphaDecay = 0.1;
        if (
            this.nodes.data().length === oldNodeCount &&
            this.links.data().length === oldLinkCount
        )
            alphaDecay = 0.6;
        // start simulartion only when there are new nodes
        d3.select("body").style("pointer-events", "none");
        this.simulation
            .alpha(1)
            .alphaMin(0.3)
            .alphaDecay(alphaDecay)
            .restart();
    };

    renderNewTable = () => {
        // dom element that D3 is in control of
        var graphMainSvg = d3.select(this.svgRef.current);

        // update nodeData and linkData
        let neighbors = this.getOneHopNeighbors();
        let nodeData = neighbors.nodeData.concat({
            table_name: this.props.curTable,
            numCanvas: this.props.tableMetadata[this.props.curTable].numCanvas,
            numRecords: this.props.tableMetadata[this.props.curTable].numRecords
        });
        let linkData = neighbors.linkData;

        graphMainSvg.selectAll("*").remove();
        var lineg = graphMainSvg.append("g").classed("lineg", true);
        var circleg = graphMainSvg.append("g").classed("circleg", true);
        this.nodes = circleg
            .selectAll("circle")
            .data(nodeData)
            .join("circle")
            .attr("r", this.circleRadius)
            .classed("graphnew", true)
            .on("click", this.props.handleNodeClick);
        this.links = lineg
            .selectAll("line")
            .data(linkData)
            .join("line")
            .classed("graphnew", true);
        this.makeTooltips(
            this.nodes,
            ["table_name", "numRecords", "numCanvas"],
            ["Table", "# of Records", "# of vis"]
        );

        this.simulation.nodes(nodeData);
        this.simulation.force("link").links(linkData);
        d3.select("body").style("pointer-events", "none");
        this.simulation
            .alpha(1)
            .alphaDecay(0.1)
            .alphaMin(0.3)
            .restart();

        var supermang = graphMainSvg.append("g").classed("supermang", true);
        supermang
            .append("image")
            .attr("id", "supermanlogo")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.supermanW)
            .attr("height", this.supermanH)
            .style("pointer-events", "none")
            .attr(
                "xlink:href",
                "https://upload.wikimedia.org/wikipedia/commons/0/05/Superman_S_symbol.svg"
            );

        // d3 zoom to enable pan
        const zoomHandler = d3
            .zoom()
            .scaleExtent([1, 1])
            .on("zoom", () => {
                d3.select("body")
                    .selectAll(".kyrixtooltip")
                    .remove();
                circleg.attr("transform", d3.event.transform);
                lineg.attr("transform", d3.event.transform);
                supermang.attr("transform", d3.event.transform);
            });

        graphMainSvg.call(zoomHandler);

        // register jump handlers
        this.registerJumpHandlers();

        // call resize svg
        resizeSvgs();
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
                .style("padding-top", (p, i) => (i === 0 ? "10px" : "1px"))
                .style("padding-bottom", (p, i) =>
                    i === columns.length - 1 ? "10px" : "1px"
                );

            // column values
            rows.append("td")
                .html(p => (!isNaN(d[p]) ? d3.format("~s")(d[p]) : d[p]))
                .style("font-weight", "900")
                .style("padding-left", "2px")
                .style("padding-right", "10px")
                .style("padding-top", (p, i) => (i === 0 ? "10px" : "1px"))
                .style("padding-bottom", (p, i) =>
                    i === columns.length - 1 ? "10px" : "1px"
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

    registerJumpHandlers = () => {
        if (window.kyrix.on("jumpstart.switch", "ssv0") != null) return;

        var graphMainSvg = d3.select(this.svgRef.current);

        const jumpStartSwitch = jump => {
            var nodes = graphMainSvg.selectAll("circle");
            // get source and dest coordinates
            var startTable = this.props.canvasIdToTable[
                jump.backspace ? jump.destId : jump.sourceId
            ];
            var startNode = nodes.filter(d =>
                d.table_name === startTable ? true : false
            );
            var startCx = startNode.attr("cx");
            var startCy = startNode.attr("cy");

            var endTable = this.props.canvasIdToTable[
                jump.backspace ? jump.sourceId : jump.destId
            ];
            var endNode = nodes.filter(d =>
                d.table_name === endTable ? true : false
            );
            var endCx = endNode.attr("cx");
            var endCy = endNode.attr("cy");

            if (startTable === endTable) return;

            // change jump's slide direction
            var disX = endCx - startCx;
            var disY = endCy - startCy;
            var dir =
                (Math.acos(disX / Math.sqrt(disX * disX + disY * disY)) /
                    Math.PI) *
                180;
            if (endCy < startCy) dir = 360 - dir;
            jump.slideDirection = 360 - dir;

            // animate the logo
            d3.select("#supermanlogo")
                .transition()
                .ease(d3.easeLinear)
                .duration(2700)
                .attr("x", endCx - this.supermanW / 2)
                .attr("y", endCy - this.supermanH / 2)
                .on("start", () => {
                    d3.select("body").style("pointer-events", "none");
                })
                .on("end", () => {
                    d3.select("body").style("pointer-events", "auto");
                });
        };

        const jumpStartZoom = jump => {
            if (jump.type !== "semantic_zoom") return;
            let circleRadius = this.circleRadius;
            var nodes = graphMainSvg.selectAll("circle");
            var currentNode = nodes.filter(d =>
                d.table_name === this.props.curTable ? true : false
            );
            var arrowG = graphMainSvg
                .select("g")
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
            var coverRect = graphMainSvg
                .select("g")
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
                            coverRect.attr(
                                "y",
                                +currentNode.attr("cy") - circleRadius
                            );
                            repeat();
                        });
            }
            d3.select("body").style("pointer-events", "none");
            repeat();
        };

        const jumpEndZoom = jump => {
            if (jump.type !== "semantic_zoom") return;
            var coverRect = d3.select("#coverrect");
            if (coverRect.empty()) return;
            coverRect.interrupt();
            coverRect.remove();
            d3.select("#arrowG").remove();
            d3.select("body").style("pointer-events", "auto");
        };

        window.kyrix.on("jumpstart.switch", "ssv0", jumpStartSwitch.bind(this));
        window.kyrix.on("jumpstart.zoom", "ssv0", jumpStartZoom.bind(this));
        window.kyrix.on("jumpend.zoom", "ssv0", jumpEndZoom.bind(this));
    };

    render() {
        return (
            <div className="erdiagram svgdiv">
                <svg
                    className="erdiagramsvg"
                    width={this.props.width}
                    height={this.props.height}
                    ref={this.svgRef}
                ></svg>
                <ButtonGroup
                    className="graphbutton"
                    size="large"
                    variant="text"
                    color="primary"
                    aria-label="text primary button group"
                >
                    <Button
                        style={{
                            color: "#1976d2",
                            fontSize: 12,
                            fontFamily: "Arial"
                        }}
                    >
                        re-center
                    </Button>
                    <Button
                        style={{
                            color: "#1976d2",
                            fontSize: 12,
                            fontFamily: "Arial"
                        }}
                    >
                        trim
                    </Button>
                    <Button
                        style={{
                            color: "#1976d2",
                            fontSize: 12,
                            fontFamily: "Arial"
                        }}
                    >
                        what's new?
                    </Button>
                </ButtonGroup>
                <div className="explain">Schema Graph View</div>
            </div>
        );
    }
}

export default SchemaGraph;
