import React, {Component} from "react";
import * as d3 from "d3";
import {resizeSvgs} from "./ResizeStuff";
import NodePopover from "./low-level-components/NodePopover";
import EdgePopover from "./low-level-components/EdgePopover";
import {Button, Space} from "antd";
import {createFromIconfontCN} from "@ant-design/icons/lib/index";
import {point, circle, segment, Polygon} from "@flatten-js/core";

class SchemaGraph extends Component {
    constructor(props) {
        super(props);
        this.state = {};

        // svg for D3
        this.svgRef = React.createRef();

        // initialize D3 force directed layout
        this.supermanW = (this.props.width / 1000) * 70;
        this.supermanH = (this.props.width / 1000) * 60;
        this.circleRadius = (this.props.width / 1000) * 60;
        let tickFunction = () => {
            this.nodes.attr("cx", d => d.x).attr("cy", d => d.y);
            this.links
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            var curNode = this.nodes.filter(
                d => d.table_name === this.props.curTable
            );
            d3.select("#supermanlogo")
                .attr("x", curNode.attr("cx") - this.supermanW / 2)
                .attr("y", curNode.attr("cy") - this.supermanH / 2);
            // check if we should stop
            let maxVelocity = d3.max(
                this.nodes.data().map(d => d.vx * d.vx + d.vy * d.vy)
            );
            if (maxVelocity <= 5) {
                this.simulation.stop();
                endFunction();
            }
        };
        let endFunction = () => {
            if (this.nodes) {
                this.nodes.each(d => {
                    d.fx = d.x;
                    d.fy = d.y;
                });
                d3.select("body").style("pointer-events", "auto");
                this.newStuff = d3.selectAll(".graphnew");
                this.reCenterGraph().then(this.showNewStuff);
            }
        };
        this.simulation = d3
            .forceSimulation()
            .force(
                "link",
                d3
                    .forceLink()
                    .id(d => d.table_name)
                    .distance((this.props.width / 1000) * 200)
            )
            .force(
                "charge",
                d3
                    .forceManyBody()
                    .strength(-8000)
                    .distanceMax((this.props.width / 1000) * 400)
                    .distanceMin((this.props.width / 1000) * 200)
            )
            .on("tick", tickFunction.bind(this))
            .on("end", endFunction.bind(this))
            .stop();

        // iconfont
        this.IconFont = createFromIconfontCN({
            scriptUrl: "//at.alicdn.com/t/font_2257494_inodlmuktwo.js"
        });
    }

    componentDidMount = () => {
        if (!this.props.kyrixLoaded) return;
        this.renderNewTable();
    };

    componentDidUpdate = () => {
        if (!this.props.kyrixLoaded) return;
        if (
            this.props.interactionType === "searchBarSearch" ||
            this.props.interactionType === "kyrixRandomJump" ||
            this.props.interactionType === "historyItemClick" ||
            this.props.interactionType === "kyrixLoaded"
        )
            this.renderNewTable();
        else if (this.props.interactionType === "kyrixJumpMouseover")
            this.highlightLinkOnJumpMouseover();
        else if (this.props.interactionType === "kyrixJumpMouseleave")
            this.cancelLinkHighlightOnJumpMouseleave();
        else this.renderNewNeighbors();
        this.registerPopoverMouseEvents();
    };

    shouldComponentUpdate = nextProps =>
        nextProps.curTable !== this.props.curTable ||
        nextProps.interactionType === "kyrixJumpMouseover" ||
        nextProps.interactionType === "kyrixJumpMouseleave";

    getPopovers = () => {
        if (this.props.curTable === "") return [];

        // get new node data using this.nodes
        let nodeData = this.nodes ? this.nodes.data() : [];
        let neighbors = this.getOneHopNeighbors();
        neighbors.nodeData = neighbors.nodeData.concat({
            table_name: this.props.curTable,
            numCanvas: this.props.tableMetadata[this.props.curTable].numCanvas,
            numRecords: this.props.tableMetadata[this.props.curTable].numRecords
        });
        nodeData = nodeData.concat(
            neighbors.nodeData.filter(
                d => !nodeData.map(d => d.table_name).includes(d.table_name)
            )
        );

        // get new link data
        neighbors = this.getOneHopNeighbors();
        let edges = this.props.graphEdges.filter(d => {
            if (
                this.links &&
                this.links
                    .data()
                    .filter(
                        p =>
                            (p.source.table_name === d.source &&
                                p.target.table_name === d.target) ||
                            (p.source.table_name === d.target &&
                                p.target.table_name === d.source)
                    ).length > 0
            )
                return true;
            if (
                neighbors.linkData.filter(
                    p =>
                        (p.source === d.source && p.target === d.target) ||
                        (p.source === d.target && p.target === d.source)
                ).length > 0
            )
                return true;
            return false;
        });

        const nodePopovers = nodeData.map(d => (
            <NodePopover
                key={d.table_name}
                tableColumns={this.props.tableColumns}
                d={d}
            />
        ));

        const edgePopovers = edges.map(d => (
            <EdgePopover key={d.source + "_" + d.target} edge={d} />
        ));

        return nodePopovers.concat(edgePopovers);
    };

    reCenterGraph = () => {
        let oldTransform = d3.zoomTransform(this.svgRef.current);
        let oldTX = oldTransform.x;
        let oldTY = oldTransform.y;

        let curNode = this.nodes
            .data()
            .filter(d => d.table_name === this.props.curTable)[0];
        let newTX = this.props.width / 2 - curNode.x;
        let newTY = this.props.height / 2 - curNode.y;
        let newTransform = d3.zoomIdentity.translate(newTX, newTY);

        d3.select("body").style("pointer-events", "none");

        let graphMainSvg = d3.select(this.svgRef.current);
        return graphMainSvg
            .transition()
            .duration(
                Math.sqrt(
                    (newTX - oldTX) * (newTX - oldTX) +
                        (newTY - oldTY) * (newTY - oldTY)
                )
            )
            .call(this.zoomHandler.transform, newTransform)
            .on("end", () => {
                d3.select("body").style("pointer-events", "auto");
            })
            .end();
    };

    trimToOneHopNeighbors = () => {
        let neighbors = this.getOneHopNeighbors().nodeData.map(
            d => d.table_name
        );
        neighbors.push(this.props.curTable);

        // transition out non 1 hop neighbors
        d3.select("body").style("pointer-events", "none");
        let circleToBeDeleted = d3
            .selectAll(".circleg > circle")
            .filter(d => neighbors.indexOf(d.table_name) === -1);
        let circleDeletionEnd = null;
        if (!circleToBeDeleted.empty())
            circleDeletionEnd = circleToBeDeleted
                .transition()
                .duration(100)
                .style("opacity", 0)
                .remove()
                .end();
        let linesToBeDeleted = d3
            .selectAll(".lineg > line")
            .filter(
                d =>
                    d.source.table_name !== this.props.curTable &&
                    d.target.table_name !== this.props.curTable
            );
        let lineDeletionEnd = null;
        if (!linesToBeDeleted.empty())
            lineDeletionEnd = linesToBeDeleted
                .transition()
                .duration(100)
                .style("opacity", 0)
                .remove()
                .end();
        Promise.all([circleDeletionEnd, lineDeletionEnd]).then(() => {
            let graphMainSvg = d3.select(this.svgRef.current);
            this.nodes = graphMainSvg
                .select(".circleg")
                .selectAll("circle")
                .classed("graphnew", true);
            this.links = graphMainSvg
                .select(".lineg")
                .selectAll("line")
                .classed("graphnew", true);
            this.nodes
                .filter(d => d.table_name !== this.props.curTable)
                .each(d => (d.fx = d.fy = null));

            // update and restart simulation
            this.simulation.nodes(this.nodes.data());
            this.simulation.force("link").links(this.links.data());
            d3.select("body").style("pointer-events", "none");
            this.simulation.alpha(1).restart();
        });
    };

    showNewStuff = () => {
        if (!this.newStuff || this.newStuff.size() === 0) return;
        d3.select("body").style("pointer-events", "none");
        this.newStuff
            .transition()
            .duration(500)
            .style("stroke", "#111")
            .transition()
            .duration(500)
            .style("stroke", null)
            .on("end", (d, i, nodes) => {
                if (i === 0) {
                    d3.selectAll(nodes).classed("graphnew", false);
                    d3.select("body").style("pointer-events", "auto");
                }
            });
    };

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
        d3.select("body").style("pointer-events", "none");
        this.simulation.alpha(1).restart();
    };

    renderNewTable = () => {
        // dom element that D3 is in control of
        var graphMainSvg = d3.select(this.svgRef.current);

        // update nodeData and linkData
        let neighbors = this.getOneHopNeighbors();
        let nodeData = neighbors.nodeData.concat({
            table_name: this.props.curTable,
            numCanvas: this.props.tableMetadata[this.props.curTable].numCanvas,
            numRecords: this.props.tableMetadata[this.props.curTable]
                .numRecords,
            fx: this.props.width / 2,
            fy: this.props.height / 2
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

        this.simulation.nodes(nodeData);
        this.simulation.force("link").links(linkData);
        d3.select("body").style("pointer-events", "none");
        this.simulation.alpha(1).restart();

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
        this.zoomHandler = d3
            .zoom()
            .scaleExtent([1, 1])
            .on("zoom", () => {
                d3.selectAll(
                    ".ant-popover.node-popover, .ant-popover.edge-popover"
                ).style("visibility", "hidden");
                circleg.attr("transform", d3.event.transform);
                lineg.attr("transform", d3.event.transform);
                supermang.attr("transform", d3.event.transform);
            });

        graphMainSvg.call(this.zoomHandler);
        graphMainSvg.call(this.zoomHandler.transform, d3.zoomIdentity);

        // register jump handlers
        this.registerJumpHandlers();

        // call resize svg
        resizeSvgs();
    };

    registerPopoverMouseEvents = () => {
        const checkMouseLeave = () => {
            // mouseleave fires for children too,
            // so we should return when it's the case
            if (!d3.select(d3.event.target).classed("ant-popover")) return true;

            // do not mess with mouseleave when main target is hidden
            if (d3.select(d3.event.target).style("visibility") === "hidden")
                return true;

            // if related target is null
            // like you moved outside your browser window
            // we just make the target in visible
            if (d3.event.relatedTarget == null) {
                d3.select(d3.event.target).style("visibility", "hidden");
                return true;
            }

            // do not mess with mouseleave when the related target is hidden
            if (
                d3.select(d3.event.relatedTarget).style("visibility") ===
                "hidden"
            )
                return true;
        };

        this.nodes
            .on("mouseover", d => {
                if (d == null || typeof d !== "object") return;
                let clientRect = d3.event.currentTarget.getBoundingClientRect();
                let className = ".node-popover-" + d.table_name;
                let popoverWidth = d3
                    .select(className)
                    .node()
                    .getBoundingClientRect().width;
                let clientCx =
                    clientRect.x + clientRect.width / 2 - popoverWidth / 2;
                let clientCy = clientRect.y + clientRect.height;
                d3.select(className)
                    .style("left", clientCx + "px")
                    .style("top", clientCy + "px")
                    .style("visibility", "visible");
            })
            .on("mouseleave", d => {
                if (d == null || typeof d !== "object") return;
                if (
                    d3.event.relatedTarget == null ||
                    d3.event.relatedTarget.closest(".ant-popover") == null
                )
                    d3.select(".node-popover-" + d.table_name).style(
                        "visibility",
                        "hidden"
                    );
            });

        d3.selectAll(".ant-popover.node-popover").on("mouseleave", () => {
            // return early for non-essential firings of mouseleave
            if (checkMouseLeave()) return;

            // check if event.relatedTarget is a circle
            // and that circle is the popover's trigger
            let targetRect = d3.event.target.getBoundingClientRect();
            let relatedRect = d3.event.relatedTarget.getBoundingClientRect();
            if (
                d3.event.relatedTarget.tagName !== "circle" ||
                relatedRect.x + relatedRect.width / 2 !==
                    targetRect.x + targetRect.width / 2 ||
                relatedRect.y + relatedRect.height !== targetRect.y
            )
                d3.select(d3.event.target).style("visibility", "hidden");
        });

        this.links
            .on("mouseover", d => {
                if (d == null || typeof d !== "object") return;
                let clientRect = d3.event.currentTarget.getBoundingClientRect();
                let className =
                    ".edge-popover-" +
                    d.source.table_name +
                    ".edge-popover-" +
                    d.target.table_name;
                let popoverWidth = d3
                    .select(className)
                    .node()
                    .getBoundingClientRect().width;
                let popoverHeight = d3
                    .select(className)
                    .node()
                    .getBoundingClientRect().height;
                let clientCx =
                    clientRect.x + clientRect.width / 2 - popoverWidth;
                let clientCy =
                    clientRect.y + clientRect.height / 2 - popoverHeight / 2;
                d3.select(className)
                    .style("left", clientCx + "px")
                    .style("top", clientCy + "px")
                    .style("visibility", "visible");
            })
            .on("mouseleave", d => {
                if (d == null || typeof d !== "object") return;
                if (
                    d3.event.relatedTarget == null ||
                    d3.event.relatedTarget.closest(".ant-popover") == null
                )
                    d3.select(
                        ".edge-popover-" +
                            d.source.table_name +
                            ".edge-popover-" +
                            d.target.table_name
                    ).style("visibility", "hidden");
            });

        d3.selectAll(".ant-popover.edge-popover").on("mouseleave", () => {
            // return early for non-essential firings of mouseleave
            if (checkMouseLeave()) return;

            // check if event.relatedTarget is a line
            // and that circle is the popover's trigger
            let targetRect = d3.event.target.getBoundingClientRect();
            let relatedRect = d3.event.relatedTarget.getBoundingClientRect();
            if (
                d3.event.relatedTarget.tagName !== "line" ||
                relatedRect.x + relatedRect.width / 2 !== targetRect.x ||
                relatedRect.y + relatedRect.height / 2 !==
                    targetRect.y + targetRect.height / 2
            )
                d3.select(d3.event.target).style("visibility", "hidden");
        });
    };

    registerJumpHandlers = () => {
        if (window.kyrix.on("jumpstart.switch", this.props.kyrixViewId) != null)
            return;

        var graphMainSvg = d3.select(this.svgRef.current);

        const jumpStartSwitch = jump => {
            if (jump.type !== "slide") return;
            var nodes = graphMainSvg.selectAll("circle");
            // get source and dest coordinates
            var startTable = this.props.canvasIdToTable[
                jump.backspace ? jump.destId : jump.sourceId
            ];
            var startNode = nodes.filter(d => d.table_name === startTable);
            var startCx = +startNode.attr("cx");
            var startCy = +startNode.attr("cy");

            var endTable = this.props.canvasIdToTable[
                jump.backspace ? jump.sourceId : jump.destId
            ];
            var endNode = nodes.filter(d => d.table_name === endTable);
            var endCx = +endNode.attr("cx");
            var endCy = +endNode.attr("cy");

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
                .duration(jump.type === "slide" ? 2700 : 200)
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
            let curRect = graphMainSvg
                .selectAll("circle")
                .filter(d => d.table_name === this.props.curTable)
                .node()
                .getBoundingClientRect();

            let selector = jump.backspace ? ".arrow-up" : ".arrow-down";
            let arrowIcon = d3
                .selectAll(selector)
                .style("visibility", "visible")
                .style("left", curRect.x + curRect.width + "px")
                .style("top", curRect.y + "px")
                .style("opacity", 0);
            var duration = 300;
            function repeat() {
                arrowIcon
                    .transition()
                    .duration(duration)
                    .style("opacity", 1)
                    .transition()
                    .style("opacity", 0)
                    .on("end", function() {
                        repeat();
                    });
            }
            d3.select("body").style("pointer-events", "none");
            repeat();
        };

        const jumpEndZoom = jump => {
            if (jump.type !== "semantic_zoom") return;
            let selector = jump.backspace ? ".arrow-up" : ".arrow-down";
            d3.selectAll(selector)
                .interrupt()
                .style("visibility", "hidden");
            d3.select("body").style("pointer-events", "auto");
        };

        window.kyrix.on(
            "jumpstart.switch",
            this.props.kyrixViewId,
            jumpStartSwitch.bind(this)
        );
        window.kyrix.on(
            "jumpstart.zoom",
            this.props.kyrixViewId,
            jumpStartZoom.bind(this)
        );
        window.kyrix.on(
            "jumpend.zoom",
            this.props.kyrixViewId,
            jumpEndZoom.bind(this)
        );
    };

    highlightLinkOnJumpMouseover = () => {
        // highlight the edge
        let curLink = this.links
            .filter(
                d =>
                    (d.source.table_name ===
                        this.props.kyrixJumpHoverEdge.source &&
                        d.target.table_name ===
                            this.props.kyrixJumpHoverEdge.target) ||
                    (d.source.table_name ===
                        this.props.kyrixJumpHoverEdge.target &&
                        d.target.table_name ===
                            this.props.kyrixJumpHoverEdge.source)
            )
            .style("stroke", "#111")
            .style("stroke-width", 23);
        if (curLink.empty()) {
            if (
                this.props.kyrixJumpHoverEdge.source ===
                this.props.kyrixJumpHoverEdge.target
            ) {
                // semantic zoom preview, arrow flicking
                let curRect = d3
                    .select(this.svgRef.current)
                    .selectAll("circle")
                    .filter(d => d.table_name === this.props.curTable)
                    .node()
                    .getBoundingClientRect();

                let selector = ".arrow-down";
                let arrowIcon = d3
                    .selectAll(selector)
                    .style("visibility", "visible")
                    .style("left", curRect.x + curRect.width + "px")
                    .style("top", curRect.y + "px")
                    .style("opacity", 0);
                var duration = 300;
                function repeat() {
                    arrowIcon
                        .transition()
                        .duration(duration)
                        .style("opacity", 1)
                        .transition()
                        .style("opacity", 0)
                        .on("end", function() {
                            repeat();
                        });
                }
                repeat();
            }
            return;
        }

        // add labels to the two nodes
        let sourceNode = this.nodes.filter(
            d => d.table_name === this.props.kyrixJumpHoverEdge.source
        );
        let sourceNodeDatum = sourceNode.datum();
        let sourceNodeRect = sourceNode.node().getBoundingClientRect();
        let sourceNodePoint = point(
            sourceNodeRect.x + sourceNodeRect.width / 2,
            sourceNodeRect.y + sourceNodeRect.height / 2
        );

        let targetNode = this.nodes.filter(
            d => d.table_name === this.props.kyrixJumpHoverEdge.target
        );
        let targetNodeDatum = targetNode.datum();
        let targetNodeRect = targetNode.node().getBoundingClientRect();
        let targetNodePoint = point(
            targetNodeRect.x + targetNodeRect.width / 2,
            targetNodeRect.y + targetNodeRect.height / 2
        );

        let lineg = d3.select(".lineg");
        let textProperties = [
            {
                xDelta: 0,
                yDelta: this.circleRadius * 1.5,
                anchor: "middle"
            },
            {
                xDelta: 0,
                yDelta: -this.circleRadius * 1.5,
                anchor: "middle"
            },
            {
                xDelta: -this.circleRadius * 1.5,
                yDelta: 0,
                anchor: "end"
            },
            {
                xDelta: this.circleRadius * 1.5,
                yDelta: 0,
                anchor: "start"
            }
        ];
        let sourceLoc = -1,
            targetLoc = -1,
            maxRating = -100;
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++) {
                // append two fake svg texts in order to get the screen coordinates
                let sourceLabel = lineg
                    .append("text")
                    .classed("jump-preview-text", true)
                    .style("opacity", 0)
                    .attr("x", sourceNodeDatum.fx + textProperties[i].xDelta)
                    .attr("y", sourceNodeDatum.fy + textProperties[i].yDelta)
                    .text(sourceNodeDatum.table_name)
                    .attr("text-anchor", textProperties[i].anchor)
                    .attr("font-size", this.supermanW * 0.6)
                    .attr("dy", ".35em");
                let targetLabel = lineg
                    .append("text")
                    .classed("jump-preview-text", true)
                    .style("opacity", 0)
                    .attr("x", targetNodeDatum.fx + textProperties[j].xDelta)
                    .attr("y", targetNodeDatum.fy + textProperties[j].yDelta)
                    .text(targetNodeDatum.table_name)
                    .attr("text-anchor", textProperties[j].anchor)
                    .attr("font-size", this.supermanW * 0.6)
                    .attr("dy", ".35em");

                // calculate rating based a few heuristic rules
                let curRating = 0;

                // if same placement, +2
                if (i === j) curRating += 2;

                // if distance is greater than the center distance, +2
                // otherwise -2
                let sourceLabelRect = sourceLabel
                    .node()
                    .getBoundingClientRect();
                let targetLabelRect = targetLabel
                    .node()
                    .getBoundingClientRect();
                let sourceLabelPolygon = new Polygon([
                    point(sourceLabelRect.x, sourceLabelRect.y),
                    point(
                        sourceLabelRect.x,
                        sourceLabelRect.y + sourceLabelRect.height
                    ),
                    point(
                        sourceLabelRect.x + sourceLabelRect.width,
                        sourceLabelRect.y
                    ),
                    point(
                        sourceLabelRect.x + sourceLabelRect.width,
                        sourceLabelRect.y + sourceLabelRect.height
                    )
                ]);
                let targetLabelPolygon = new Polygon([
                    point(targetLabelRect.x, targetLabelRect.y),
                    point(
                        targetLabelRect.x,
                        targetLabelRect.y + targetLabelRect.height
                    ),
                    point(
                        targetLabelRect.x + targetLabelRect.width,
                        targetLabelRect.y
                    ),
                    point(
                        targetLabelRect.x + targetLabelRect.width,
                        targetLabelRect.y + targetLabelRect.height
                    )
                ]);
                let polygonDis = sourceLabelPolygon.distanceTo(
                    targetLabelPolygon
                )[0];
                let centerDis = sourceNodePoint.distanceTo(targetNodePoint)[0];
                if (polygonDis >= centerDis) curRating += 2;

                // if two texts intersect, -8
                if (sourceLabelPolygon.intersect(targetLabelPolygon).length > 0)
                    curRating -= 8;

                // if intersecting the hovered edge, -5
                let mainEdge = segment(sourceNodePoint, targetNodePoint);
                if (sourceLabelPolygon.intersect(mainEdge).length > 0)
                    curRating -= 5;
                if (targetLabelPolygon.intersect(mainEdge).length > 0)
                    curRating -= 5;

                // if intersecting other edges, -2
                this.links.each(d => {
                    let sRect = this.nodes
                        .filter(p => p.table_name === d.source.table_name)
                        .node()
                        .getBoundingClientRect();
                    let tRect = this.nodes
                        .filter(p => p.table_name === d.target.table_name)
                        .node()
                        .getBoundingClientRect();
                    let sPoint = point(
                        sRect.x + sRect.width / 2,
                        sRect.y + sRect.height / 2
                    );
                    let tPoint = point(
                        tRect.x + tRect.width / 2,
                        tRect.y + tRect.height / 2
                    );
                    let curEdge = segment(sPoint, tPoint);
                    if (sourceLabelPolygon.intersect(curEdge).length > 0)
                        curRating -= 2;
                    if (targetLabelPolygon.intersect(curEdge).length > 0)
                        curRating -= 2;
                });

                // intersecting any nodes, -3
                this.nodes.each(d => {
                    let rect = this.nodes
                        .filter(p => p.table_name === d.table_name)
                        .node()
                        .getBoundingClientRect();
                    let curCenter = point(
                        rect.x + rect.width / 2,
                        rect.y + rect.height / 2
                    );
                    let curCircle = circle(curCenter, rect.width / 2);
                    if (sourceLabelPolygon.intersect(curCircle).length > 0)
                        curRating -= 3;
                    if (targetLabelPolygon.intersect(curCircle).length > 0)
                        curRating -= 3;
                });

                // update best result
                if (curRating > maxRating) {
                    maxRating = curRating;
                    sourceLoc = i;
                    targetLoc = j;
                }

                // remove text
                lineg.selectAll(".jump-preview-text").remove();
            }

        // append text
        lineg
            .append("text")
            .classed("jump-preview-text", true)
            .attr("x", sourceNodeDatum.fx + textProperties[sourceLoc].xDelta)
            .attr("y", sourceNodeDatum.fy + textProperties[sourceLoc].yDelta)
            .text(sourceNodeDatum.table_name)
            .attr("text-anchor", textProperties[sourceLoc].anchor)
            .attr("font-size", this.supermanW * 0.6)
            .attr("dy", ".35em");
        lineg
            .append("text")
            .classed("jump-preview-text", true)
            .attr("x", targetNodeDatum.fx + textProperties[targetLoc].xDelta)
            .attr("y", targetNodeDatum.fy + textProperties[targetLoc].yDelta)
            .text(targetNodeDatum.table_name)
            .attr("text-anchor", textProperties[targetLoc].anchor)
            .attr("font-size", this.supermanW * 0.6)
            .attr("dy", ".35em");

        // append a new but lighter superman logo
        d3.select(".supermang")
            .append("image")
            .attr("id", "supermanlogo_light")
            .attr("width", this.supermanW)
            .attr("height", this.supermanH)
            .style("pointer-events", "none")
            .style("opacity", 0.7)
            .attr(
                "xlink:href",
                "https://upload.wikimedia.org/wikipedia/commons/0/05/Superman_S_symbol.svg"
            );

        // start repeating transitions
        let repeat = () => {
            d3.select("#supermanlogo_light")
                .attr("x", sourceNodeDatum.fx - this.supermanW / 2)
                .attr("y", sourceNodeDatum.fy - this.supermanH / 2)
                .transition()
                .ease(d3.easeLinear)
                .duration(1300)
                .attr("x", targetNodeDatum.fx - this.supermanW / 2)
                .attr("y", targetNodeDatum.fy - this.supermanH / 2)
                .on("end", repeat);
        };
        repeat();
    };

    cancelLinkHighlightOnJumpMouseleave = () => {
        this.links
            .filter(
                d =>
                    (d.source.table_name ===
                        this.props.kyrixJumpHoverEdge.source &&
                        d.target.table_name ===
                            this.props.kyrixJumpHoverEdge.target) ||
                    (d.source.table_name ===
                        this.props.kyrixJumpHoverEdge.target &&
                        d.target.table_name ===
                            this.props.kyrixJumpHoverEdge.source)
            )
            .style("stroke", "#eee")
            .style("stroke-width", 18);
        d3.select("#supermanlogo_light")
            .interrupt()
            .remove();
        d3.selectAll(".jump-preview-text").remove();
        d3.selectAll(".arrow-down")
            .interrupt()
            .style("visibility", "hidden");
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
                <div className="graphbutton">
                    <Space>
                        <Button onClick={this.reCenterGraph} size="small">
                            Re-center
                        </Button>
                        <Button
                            onClick={this.trimToOneHopNeighbors}
                            size="small"
                        >
                            Trim
                        </Button>
                        <Button onClick={this.showNewStuff} size="small">
                            What's new?
                        </Button>
                    </Space>
                </div>
                <>{this.getPopovers()}</>
                <this.IconFont
                    type="icon-triple-arrow-up"
                    className="graph-arrow arrow-up"
                    style={{visibility: "hidden"}}
                />
                <this.IconFont
                    type="icon-triple-arrow-down"
                    className="graph-arrow arrow-down"
                    style={{visibility: "hidden"}}
                />
            </div>
        );
    }
}

export default SchemaGraph;
