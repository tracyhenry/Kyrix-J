import React, {Component} from "react";
import SchemaGraph from "./js/SchemaGraph";
import QueryInfo from "./js/QueryInfo";
import VisualDataMappings from "./js/VisualDataMappings";
import History from "./js/History";
import RawDataTable from "./js/RawDataTable";
import Bookmarks from "./js/Bookmarks";
import JumpPreview from "./js/JumpPreview";
import {
    resizeSvgs,
    getRawDataTableSize,
    resizeRawDataTable
} from "./js/ResizeStuff";
import KyrixVis from "./js/KyrixVis";
import Header from "./js/Header";
import html2canvas from "html2canvas";
import {message} from "antd";
import metadata from "./metadata/mondial";

class KyrixJ extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // visited tables
            tableHistory: [],

            // screenshot history
            screenshotHistory: [],

            // bookmarks
            bookmarks: [],

            // type of interaction that generates the new table
            // can be one of ["graphClick", "kyrixLoaded", "searchBarInputChange",
            // "kyrixVisJump", "searchBarSearch", "kyrixRandomJump",
            // "historyItemClick", "seeAnotherVisButtonClick",
            // "kyrixJumpMouseover", "kyrixJumpMouseleave"]
            // used by SchemaGraph / KyrixVis (or other components in the future)
            // to do different things
            interactionType: "",

            // current kyrix canvas
            kyrixCanvas: "",

            // current kyrix sql filters
            kyrixPredicates: [],

            // other kyrix vis states
            kyrixVx: null,
            kyrixVy: null,
            kyrixScale: null,

            // current render data
            kyrixRenderData: [],

            // raw data table states
            rawDataTableWidth: 1000,
            rawDataTableHeight: 800,
            rawDataTableVisible: false,

            // whether kyrix is loaded
            kyrixLoaded: false,

            // search bar value in Header
            searchBarValue: "",

            // search results
            searchResults: {},

            // history visible
            historyVisible: false,

            // bookmarks visible
            bookmarksVisible: false,

            // whether the bookmark save button is enabled
            bookmarksButtonDisabled: false,

            // the edge corresponding to the hovered jump option
            kyrixJumpHoverEdge: null,

            // jump preview states
            kyrixJumpPreviewVisible: false,
            kyrixJumpPreviewPlacement: "right",
            kyrixJumpPreviewCanvas: "",
            kyrixJumpPreviewPredicates: [],
            kyrixJumpPreviewX: 0,
            kyrixJumpPreviewY: 0
        };
    }

    componentDidMount = () => {
        window.addEventListener("resize", resizeSvgs);
        window.addEventListener("resize", () => {
            resizeRawDataTable(this);
        });
    };

    handleSchemaGraphNodeClick = d => {
        let tableName = d.table_name;
        this.setState({
            tableHistory: this.state.tableHistory.concat([tableName]),
            interactionType: "graphClick"
        });
    };

    handleSearchBarSearch = tableName => {
        this.setState({
            tableHistory: this.state.tableHistory.concat([tableName]),
            interactionType: "searchBarSearch"
        });
    };

    handleSearchBarInputChange = value => {
        fetch(`/search?q=${encodeURIComponent(value)}`)
            .then(res => res.json())
            .then(data => {
                if (data.query !== this.state.searchBarValue) return;
                this.setState({
                    searchResults: data.results,
                    interactionType: "searchBarInputChange"
                });
            });

        // set state
        this.setState({
            searchBarValue: value,
            searchResults: {},
            interactionType: "searchBarInputChange"
        });
    };

    handleKyrixJumpEnd = jump => {
        const nextKyrixCanvas = window.kyrix.getCurrentCanvasId(
            metadata.kyrixViewId
        );
        const nextTableHistory = this.state.tableHistory.concat(
            metadata.canvasIdToTable[nextKyrixCanvas]
        );
        if (jump.type === "slide") {
            this.setState({
                tableHistory: nextTableHistory
            });
        } else if (jump.type === "randomJumpBack") {
            this.setState({
                tableHistory: nextTableHistory,
                interactionType: "kyrixRandomJump"
            });
        } else if (jump.type === "semantic_zoom")
            this.setState({
                tableHistory: nextTableHistory
            });

        // update some other states
        const nextKyrixPredicates = window.kyrix.getGlobalVarDictionary(
            metadata.kyrixViewId
        ).predicates;
        this.setState({
            kyrixCanvas: nextKyrixCanvas,
            kyrixPredicates: nextKyrixPredicates
        });
        this.handleSearchBarInputChange("");
        this.loadData();
    };

    loadData = () => {
        const curData = window.kyrix.getRenderData(metadata.kyrixViewId);
        const visType =
            metadata.visualDataMappings[
                window.kyrix.getCurrentCanvasId(metadata.kyrixViewId)
            ].type;
        let dataLayerId = visType === "scatterplot" ? 0 : 1;
        let nextKyrixRenderData = curData[dataLayerId];
        this.setState({
            kyrixRenderData: nextKyrixRenderData
        });
    };

    handleKyrixLoad = () => {
        // set kyrix event listeners
        window.kyrix.on(
            "jumpend.settable",
            metadata.kyrixViewId,
            this.handleKyrixJumpEnd
        );
        window.kyrix.on("zoom.loaddata", metadata.kyrixViewId, this.loadData);
        window.kyrix.on("pan.loaddata", metadata.kyrixViewId, this.loadData);
        window.kyrix.on(
            "jumpstart.setinteractiontype",
            metadata.kyrixViewId,
            this.setInteractionTypeToKyrixVisJump
        );
        window.kyrix.on(
            "jumpstart.loghistory",
            metadata.kyrixViewId,
            this.createHistoryEntry
        );
        window.kyrix.on(
            "jumpmouseover",
            metadata.kyrixViewId,
            this.handleKyrixJumpMouseover
        );
        window.kyrix.on(
            "jumpmouseleave",
            metadata.kyrixViewId,
            this.handleKyrixJumpMouseleave
        );

        // load data
        this.loadData();

        // set initial states
        let kyrixCanvas = window.kyrix.getCurrentCanvasId(metadata.kyrixViewId);
        let kyrixPredicates = window.kyrix.getGlobalVarDictionary(
            metadata.kyrixViewId
        ).predicates;
        let rawDataTableSize = getRawDataTableSize();
        this.setState({
            tableHistory: [metadata.canvasIdToTable[kyrixCanvas]],
            kyrixCanvas: kyrixCanvas,
            kyrixPredicates: kyrixPredicates,
            interactionType: "kyrixLoaded",
            kyrixLoaded: true,
            rawDataTableWidth: rawDataTableSize.width,
            rawDataTableHeight: rawDataTableSize.height
        });
        this.handleSearchBarInputChange("");
    };

    setInteractionTypeToKyrixVisJump = () => {
        this.setState({
            interactionType: "kyrixVisJump"
        });
    };

    createHistoryEntry = jump => {
        if (jump.type === "literal_zoom_in" || jump.type === "literal_zoom_out")
            return;
        let historyItem = window.kyrix.getHistoryItem(metadata.kyrixViewId);

        // check if this has been booked marked before
        // if so, reuse canvas url
        let url = "";
        for (let i = 0; i < this.state.bookmarks.length; i++) {
            let curBookmark = this.state.bookmarks[i];
            if (this.historyItemsAreTheSame(curBookmark, historyItem)) {
                url = curBookmark.url;
                break;
            }
        }

        if (url.length > 0) {
            this.setState({
                screenshotHistory: this.state.screenshotHistory.concat([
                    Object.assign({}, {url: url}, historyItem)
                ])
            });
        } else {
            html2canvas(document.getElementsByClassName("kyrixvisdiv")[0], {
                logging: false
            }).then(canvas => {
                this.setState({
                    screenshotHistory: this.state.screenshotHistory.concat([
                        Object.assign(
                            {},
                            {url: canvas.toDataURL()},
                            historyItem
                        )
                    ])
                });
            });
        }
    };

    handleHistoryItemClick = historyItem => {
        if (
            this.state.kyrixCanvas === historyItem.canvasId &&
            this.state.kyrixVX === historyItem.viewportX &&
            this.state.kyrixVY === historyItem.viewportY &&
            this.state.kyrixScale === historyItem.initialScale &&
            this.state.kyrixPredicates.length ===
                historyItem.predicates.length &&
            JSON.stringify(this.state.kyrixPredicates) ===
                JSON.stringify(historyItem.predicates)
        )
            return;
        const nextTableHistory = this.state.tableHistory.concat(
            metadata.canvasIdToTable[historyItem.canvasId]
        );
        this.setState({
            tableHistory: nextTableHistory,
            interactionType: "historyItemClick",
            kyrixCanvas: historyItem.canvasId,
            kyrixPredicates: historyItem.predicates,
            kyrixVX: historyItem.viewportX,
            kyrixVY: historyItem.viewportY,
            kyrixScale: historyItem.initialScale
        });
    };

    handleHistoryVisibleChange = () => {
        this.setState({
            historyVisible: !this.state.historyVisible
        });
    };

    handleBookmarksVisibleChange = () => {
        this.setState({
            bookmarksVisible: !this.state.bookmarksVisible
        });
    };

    createBookmarkEntry = () => {
        if (this.state.bookmarksButtonDisabled) return;
        this.setState({bookmarksButtonDisabled: true});
        let historyItem = window.kyrix.getHistoryItem(metadata.kyrixViewId);
        let exist = false;
        for (let i = 0; i < this.state.bookmarks.length; i++) {
            let curBookmark = this.state.bookmarks[i];
            if (this.historyItemsAreTheSame(historyItem, curBookmark)) {
                exist = true;
                break;
            }
        }
        if (exist) {
            message.warning("This visualization is already bookmarked.", 1.5);
            this.setState({bookmarksButtonDisabled: false});
            return;
        }
        [historyItem.table] = this.state.tableHistory.slice(-1);
        html2canvas(document.getElementsByClassName("kyrixvisdiv")[0], {
            logging: false
        }).then(canvas => {
            message.success("Bookmark saved!", 1.5);
            this.setState({
                bookmarks: this.state.bookmarks.concat([
                    Object.assign({}, {url: canvas.toDataURL()}, historyItem)
                ]),
                bookmarksButtonDisabled: false
            });
        });
    };

    historyItemsAreTheSame = (a, b) => {
        return (
            a.canvasId === b.canvasId &&
            a.initialScale === b.initialScale &&
            a.viewportX === b.viewportX &&
            a.viewportY === b.viewportY &&
            JSON.stringify(a.predicates) === JSON.stringify(b.predicates)
        );
    };

    handleSeeAnotherVisButtonClick = () => {
        let [curTable] = this.state.tableHistory.slice(-1);
        if (metadata.clickJumpDefaults[curTable].length === 1) {
            message.warning(
                "There is only one visualization of this table.",
                1.5
            );
            return;
        } else
            this.setState({
                tableHistory: this.state.tableHistory.concat([curTable]),
                interactionType: "seeAnotherVisButtonClick"
            });
    };

    handleKyrixJumpMouseover = (jump, node, predicates) => {
        let sourceTable = metadata.canvasIdToTable[jump.sourceId];
        let targetTable = metadata.canvasIdToTable[jump.destId];

        let windowWidth =
            window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth;

        // jump preview location
        let jumpOptionClientBox = node.getBoundingClientRect();
        let placement,
            x,
            y = jumpOptionClientBox.y + jumpOptionClientBox.height / 2;
        if (
            jumpOptionClientBox.x + jumpOptionClientBox.width / 2 >
            windowWidth / 2
        ) {
            placement = "left";
            x = jumpOptionClientBox.x - 400;
        } else {
            placement = "right";
            x = jumpOptionClientBox.x + jumpOptionClientBox.width;
        }

        this.setState({
            interactionType: "kyrixJumpMouseover",
            kyrixJumpHoverEdge: {source: sourceTable, target: targetTable},
            kyrixJumpPreviewVisible: true,
            kyrixJumpPreviewCanvas: jump.destId,
            kyrixJumpPreviewPredicates: predicates,
            kyrixJumpPreviewPlacement: placement,
            kyrixJumpPreviewX: x,
            kyrixJumpPreviewY: y
        });
    };

    handleKyrixJumpMouseleave = jump => {
        let sourceTable = metadata.canvasIdToTable[jump.sourceId];
        let targetTable = metadata.canvasIdToTable[jump.destId];
        this.setState({
            interactionType: "kyrixJumpMouseleave",
            kyrixJumpHoverEdge: {source: sourceTable, target: targetTable},
            kyrixJumpPreviewVisible: false
        });
    };

    handleRawDataTableVisibleChange = () => {
        this.setState({
            rawDataTableVisible: !this.state.rawDataTableVisible
        });
    };

    render() {
        return (
            <>
                <Header
                    searchBarValue={this.state.searchBarValue}
                    searchResults={this.state.searchResults}
                    handleSearch={this.handleSearchBarSearch}
                    handleSearchBarInputChange={this.handleSearchBarInputChange}
                    handleHistoryVisibleChange={this.handleHistoryVisibleChange}
                    handleBookmarksVisibleChange={
                        this.handleBookmarksVisibleChange
                    }
                />
                <SchemaGraph
                    width="1500"
                    height="1500"
                    kyrixLoaded={this.state.kyrixLoaded}
                    curTable={
                        this.state.tableHistory.length > 0
                            ? this.state.tableHistory[
                                  this.state.tableHistory.length - 1
                              ]
                            : ""
                    }
                    interactionType={this.state.interactionType}
                    handleNodeClick={this.handleSchemaGraphNodeClick}
                    kyrixJumpHoverEdge={this.state.kyrixJumpHoverEdge}
                    // app metadata
                    canvasIdToTable={metadata.canvasIdToTable}
                    graphEdges={metadata.graphEdges}
                    tableMetadata={metadata.tableMetadata}
                    tableColumns={metadata.tableColumns}
                    kyrixViewId={metadata.kyrixViewId}
                />
                <QueryInfo
                    kyrixCanvas={this.state.kyrixCanvas}
                    sqlQuery={metadata.sqlQuery}
                    preview={false}
                    kyrixPredicates={this.state.kyrixPredicates}
                    handleRawDataTableVisibleChange={
                        this.handleRawDataTableVisibleChange
                    }
                />
                <VisualDataMappings
                    m={metadata.visualDataMappings[this.state.kyrixCanvas]}
                />
                <History
                    tableHistory={this.state.tableHistory}
                    screenshotHistory={this.state.screenshotHistory}
                    handleHistoryItemClick={this.handleHistoryItemClick}
                    handleHistoryVisibleChange={this.handleHistoryVisibleChange}
                    visible={this.state.historyVisible}
                />
                <Bookmarks
                    bookmarks={this.state.bookmarks}
                    handleHistoryItemClick={this.handleHistoryItemClick}
                    handleBookmarksVisibleChange={
                        this.handleBookmarksVisibleChange
                    }
                    visible={this.state.bookmarksVisible}
                />
                <KyrixVis
                    handleKyrixLoad={this.handleKyrixLoad}
                    curTable={
                        this.state.tableHistory.length > 0
                            ? this.state.tableHistory[
                                  this.state.tableHistory.length - 1
                              ]
                            : ""
                    }
                    interactionType={this.state.interactionType}
                    kyrixLoaded={this.state.kyrixLoaded}
                    handleBookmarkButtonClick={this.createBookmarkEntry}
                    bookmarksButtonDisabled={this.state.bookmarksButtonDisabled}
                    handleSeeAnotherVisButtonClick={
                        this.handleSeeAnotherVisButtonClick
                    }
                    // kyrix states
                    // only useful in "historyItemClick"
                    kyrixCanvas={this.state.kyrixCanvas}
                    kyrixPredicates={this.state.kyrixPredicates}
                    kyrixVX={this.state.kyrixVX}
                    kyrixVY={this.state.kyrixVY}
                    kyrixScale={this.state.kyrixScale}
                    // app metadata (TODO: combine them into one field)
                    kyrixViewId={metadata.kyrixViewId}
                    clickJumpDefaults={metadata.clickJumpDefaults}
                />
                <RawDataTable
                    primaryKeys={metadata.primaryKeys}
                    curTable={
                        this.state.tableHistory.length > 0
                            ? this.state.tableHistory[
                                  this.state.tableHistory.length - 1
                              ]
                            : ""
                    }
                    kyrixRenderData={this.state.kyrixRenderData}
                    visible={this.state.rawDataTableVisible}
                    width={this.state.rawDataTableWidth}
                    height={this.state.rawDataTableHeight}
                    handleVisibleChange={this.handleRawDataTableVisibleChange}
                />
                <JumpPreview
                    kyrixLoaded={this.state.kyrixLoaded}
                    sqlQuery={metadata.sqlQuery}
                    visible={this.state.kyrixJumpPreviewVisible}
                    kyrixCanvas={this.state.kyrixJumpPreviewCanvas}
                    kyrixPredicates={this.state.kyrixJumpPreviewPredicates}
                    placement={this.state.kyrixJumpPreviewPlacement}
                    x={this.state.kyrixJumpPreviewX}
                    y={this.state.kyrixJumpPreviewY}
                    kyrixViewId={metadata.kyrixViewId}
                />
            </>
        );
    }
}

export default KyrixJ;
