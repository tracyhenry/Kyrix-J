(function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? factory(exports)
        : typeof define === "function" && define.amd
        ? define(["exports"], factory)
        : ((global = global || self), factory((global.kyrix = {})));
})(this, function(exports) {
    "use strict";

    // initialize app, pass in server url and a div for holding kyrix vis
    // return a promise that resolves when kyrix loads
    function initializeApp(serverAddr, kyrixDiv) {
        return pageOnLoad(serverAddr, kyrixDiv);
    }

    function filteredNodes(viewId, layerId, filterFunc) {
        var viewClass = ".view_" + viewId;
        return d3
            .select(".kyrixdiv")
            .selectAll(viewClass + ".layerg.layer" + layerId)
            .selectAll(".lowestsvg")
            .selectAll("g")
            .selectAll("*")
            .filter(filterFunc)
            .nodes();
    }

    function setFilteredNodesOpacity(viewId, layerId, filterFunc, opacity) {
        var visibleNodes = filteredNodes(viewId, layerId, filterFunc);
        visibleNodes.forEach(function(node) {
            d3.select(node).attr("opacity", opacity);
        });
        return visibleNodes;
    }

    function displayOnlyFilteredNodes(viewId, layerId, filterFunc) {
        var visibleNodes = setFilteredNodesOpacity(
            viewId,
            layerId,
            filterFunc,
            1
        );
        setFilteredNodesOpacity(
            viewId,
            layerId,
            function(d) {
                return !filterFunc(d);
            },
            0
        );
        return visibleNodes;
    }

    function getCurrentCanvasId(viewId) {
        return globalVar.views[viewId].curCanvasId;
    }

    function triggerPan(viewId, panX, panY) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;
        var curSelection = d3.select(viewClass + ".maing");

        // start a pan tween
        d3.transition()
            .duration(1000)
            .tween("webTriggeredPanTween", function() {
                var i = d3.interpolateNumber(0, panX);
                var j = d3.interpolateNumber(0, panY);
                var initialTransform = d3.zoomTransform(curSelection.node());
                return function(t) {
                    var deltaX = i(t);
                    var deltaY = j(t);
                    curSelection.call(
                        gvd.zoom.transform,
                        initialTransform.translate(deltaX, deltaY)
                    );
                };
            });
    }

    function getRenderData(viewId) {
        var gvd = globalVar.views[viewId];
        var ret = [];
        for (var i = 0; i < gvd.renderData.length; i++) {
            if (gvd.curCanvas.layers[i].isStatic)
                ret.push(gvd.curStaticData[i]);
            else ret.push(gvd.renderData[i]);
        }
        return ret;
    }

    function getRenderDataOfLayer(viewId, layerId) {
        var gvd = globalVar.views[viewId];
        if (gvd.curCanvas.layers[layerId].isStatic)
            return gvd.curStaticData[layerId];
        else return gvd.renderData[layerId];
    }

    function getObjectData(viewId) {
        var gvd = globalVar.views[viewId];
        var renderData = [];
        var numLayers = gvd.curCanvas.layers.length;
        for (var i = 0; i < numLayers; i++)
            renderData.push(getObjectDataOfLayer(viewId, i));
        return renderData;
    }

    function getObjectDataOfLayer(viewId, layerId) {
        var viewClass = ".view_" + viewId;
        var curlayerData = [];
        var mp = {}; // hashset
        d3.select(".kyrixdiv")
            .selectAll(viewClass + ".layerg.layer" + layerId)
            .selectAll(".lowestsvg")
            .selectAll("g")
            .selectAll("*")
            .each(function(d) {
                if (d == null || mp.hasOwnProperty(JSON.stringify(d))) return;
                mp[JSON.stringify(d)] = true;
                curlayerData.push(d);
            });
        return curlayerData;
    }

    function getViewSvg(viewId) {
        return d3.select(".view_" + viewId + ".viewsvg").node();
    }

    function getMainSvg(viewId, layerId) {
        return d3
            .select(".view_" + viewId + ".layerg.layer" + layerId)
            .select(".mainsvg")
            .node();
    }

    function getCurrentViewport(viewId) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;
        if (d3.select(viewClass + ".mainsvg:not(.static)").size() == 0)
            return {
                vpX: 0,
                vpY: 0,
                vpW: gvd.viewportWidth,
                vpH: gvd.viewportHeight
            };
        else {
            var viewBox = d3
                .select(viewClass + ".mainsvg:not(.static)")
                .attr("viewBox")
                .split(" ");
            return {
                vpX: viewBox[0],
                vpY: viewBox[1],
                vpW: viewBox[2],
                vpH: viewBox[3]
            };
        }
    }

    function on(evt, viewId, callback) {
        function throwError() {
            throw new Error("kyrix.on: unrecognized Kyrix event type.");
        }
        var gvd = globalVar.views[viewId];
        var evtTypes = ["pan", "zoom", "jumpstart", "jumpend"];
        for (var evtType of evtTypes)
            if (evt.startsWith(evtType)) {
                if (evt.length > evtType.length && evt[evtType.length] != ".")
                    throwError();
                var gvdKey =
                    "on" +
                    evtType[0].toUpperCase() +
                    evtType.substring(1) +
                    "Handlers";
                if (!gvd[gvdKey]) gvd[gvdKey] = {};
                var subEvt = "";
                if (evt.length > evtType.length)
                    subEvt = evt.substring(evtType.length + 1);
                if (typeof callback == "undefined") return gvd[gvdKey][subEvt];
                gvd[gvdKey][subEvt] = callback;

                return;
            }
        throwError();
    }

    function reRender(viewId, layerId, additionalArgs) {
        var viewClass = ".view_" + viewId;
        var gvd = globalVar.views[viewId];
        var renderFunc = gvd.curCanvas.layers[
            layerId
        ].rendering.parseFunction();

        // getting args dictionary
        var curVp = getCurrentViewport(viewId);
        var oldArgs = getOptionalArgs(viewId);
        oldArgs["viewportX"] = curVp["vpX"];
        oldArgs["viewportY"] = curVp["vpY"];
        oldArgs["layerId"] = layerId;
        oldArgs["ssvId"] = gvd.curCanvas.layers[layerId].ssvId;
        oldArgs["usmapId"] = gvd.curCanvas.layers[layerId].usmapId;
        oldArgs["staticAggregationId"] =
            gvd.curCanvas.layers[layerId].staticAggregationId;
        var allArgs = Object.assign({}, oldArgs, additionalArgs);

        // re render the svg
        var renderData = getRenderDataOfLayer(viewId, layerId);
        d3.select(viewClass + ".layerg.layer" + layerId)
            .selectAll(".lowestsvg")
            .selectAll("*")
            .remove();
        d3.select(viewClass + ".layerg.layer" + layerId)
            .selectAll(".lowestsvg")
            .each(function() {
                // run render function
                renderFunc(d3.select(this), renderData, allArgs);

                // tooltips
                makeTooltips(
                    d3.select(this).selectAll("*"),
                    gvd.curCanvas.layers[layerId].tooltipColumns,
                    gvd.curCanvas.layers[layerId].tooltipAliases
                );

                // register jumps
                registerJumps(viewId, d3.select(this), layerId);

                // apply highlight
                highlightLowestSvg(viewId, d3.select(this), layerId);
            });
    }

    function triggerJump(viewId, selector, layerId, jumpId) {
        var gvd = globalVar.views[viewId];
        var curDatum = d3.select(selector).datum();
        var jump = gvd.curJump[jumpId];

        // check applicability
        var optionalArgs = getOptionalArgs(viewId);
        optionalArgs["layerId"] = layerId;
        if (!jump.selector.parseFunction()(curDatum, optionalArgs))
            throw new Error("This jump is not applicable on this object.");

        // start jump
        startJump(viewId, curDatum, jump, optionalArgs);
    }

    function addRenderingParameters(params) {
        var keys = Object.keys(params);
        for (var i = 0; i < keys.length; i++)
            globalVar.renderingParams[keys[i]] = params[keys[i]];
    }

    function getRenderingParameters() {
        return globalVar.renderingParams;
    }

    function getGlobalVarDictionary(viewId) {
        return globalVar.views[viewId];
    }

    function triggerPredicate(viewId, predDict) {
        var gvd = globalVar.views[viewId];

        var vp = getCurrentViewport(viewId);

        // step 1: get predicates, viewport, scale
        var predArray = [];
        var numLayer = gvd.curCanvas.layers.length;
        for (var i = 0; i < numLayer; i++)
            if ("layer" + i in predDict) predArray.push(predDict["layer" + i]);
            else predArray.push({});

        var newVpX = vp.vpX;
        var newVpY = vp.vpY;
        var viewClass = ".view_" + viewId + ".maing";
        var k = d3.zoomTransform(d3.select(viewClass).node()).k;

        // step 2: load
        load(predArray, newVpX, newVpY, k, viewId, gvd.curCanvasId, {
            type: param.load
        });
    }

    function randomJump(
        viewId,
        canvasId,
        predDict,
        newVpX,
        newVpY,
        newScale,
        predicateType
    ) {
        var gvd = globalVar.views[viewId];
        // get pred array
        var predArray = [];
        var destCanvas = getCanvasById(canvasId);
        if (predicateType == "array") predArray = predDict;
        else {
            var numLayer = destCanvas.layers.length;
            for (var i = 0; i < numLayer; i++)
                if ("layer" + i in predDict)
                    predArray.push(predDict["layer" + i]);
                else predArray.push({});
        }
        // call load
        load(predArray, newVpX, newVpY, newScale, viewId, canvasId, {
            type: "randomJump"
        });
    }

    // setting up global variables
    var globalVar = {};

    // kyrix backend url
    globalVar.serverAddr = "N/A";

    // tile width and tile height
    globalVar.tileW = 0;
    globalVar.tileH = 0;

    // cache
    globalVar.cachedCanvases = {};

    // global rendering params (specified by the developer)
    globalVar.renderingParams = null;

    // global var dictionaries for views
    globalVar.views = {};

    // globalVar project
    globalVar.project = null;

    if (typeof String.prototype.parseFunction != "function") {
        String.prototype.parseFunction = function() {
            var funcReg = /function *[^()]*\(([^()]*)\)[ \n\t]*\{([\s\S]*)\}/gim;
            var match = funcReg.exec(this);
            if (match) return new Function(match[1].split(","), match[2]);
            else return null;
        };
    }

    /****************** common functions ******************/
    function getOptionalArgs(viewId) {
        var gvd = globalVar.views[viewId];
        var predicateDict = {};
        for (var i = 0; i < gvd.predicates.length; i++)
            predicateDict["layer" + i] = gvd.predicates[i];
        var optionalArgs = {
            canvasId: gvd.curCanvas.id,
            canvasW: gvd.curCanvas.w,
            canvasH: gvd.curCanvas.h,
            pyramidLevel: gvd.curCanvas.pyramidLevel,
            viewportW: gvd.viewportWidth,
            viewportH: gvd.viewportHeight,
            predicates: predicateDict,
            tileW: globalVar.tileW,
            tileH: globalVar.tileH,
            viewId: viewId,
            renderingParams: globalVar.renderingParams
        };

        return optionalArgs;
    }

    // get SQL predicates from a predicate dictionary
    function getSqlPredicate(p) {
        if ("==" in p)
            return (
                "(" +
                p["=="][0].toString().replace(/&/g, "%26") +
                "='" +
                p["=="][1].toString().replace(/&/g, "%26") +
                "')"
            );
        if ("AND" in p)
            return (
                "(" +
                getSqlPredicate(p["AND"][0]) +
                " AND " +
                getSqlPredicate(p["AND"][1]) +
                ")"
            );
        if ("OR" in p)
            return (
                "(" +
                getSqlPredicate(p["OR"][0]) +
                " OR " +
                getSqlPredicate(p["OR"][1]) +
                ")"
            );
        return "";
    }

    // check whether a given datum passes a filter
    function isHighlighted(d, p) {
        if (p == null || p == {}) return true;
        if ("==" in p) return d[p["=="][0]] == p["=="][1];
        if ("AND" in p)
            return (
                isHighlighted(d, p["AND"][0]) && isHighlighted(d, p["AND"][1])
            );
        if ("OR" in p)
            return isHighlighted(d, p["OR"][0]) || isHighlighted(d, p["OR"][1]);

        return false;
    }

    // get a canvas object by a canvas ID
    function getCanvasById(canvasId) {
        for (var i = 0; i < globalVar.project.canvases.length; i++)
            if (globalVar.project.canvases[i].id == canvasId)
                return globalVar.project.canvases[i];

        return null;
    }

    // get jumps starting from a canvas
    function getJumpsByCanvasId(canvasId) {
        var jumps = [];
        for (var i = 0; i < globalVar.project.jumps.length; i++)
            if (globalVar.project.jumps[i].sourceId == canvasId)
                jumps.push(globalVar.project.jumps[i]);

        return jumps;
    }

    // make tooltips after rendering functions are called
    function makeTooltips(selection, columns, aliases) {
        var createTooltip = function(d) {
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
                .html(p =>
                    !isNaN(d[p])
                        ? (+d[p]).toFixed(2).replace(/\.?0*$/, "")
                        : d[p]
                )
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
    }
    function removePopovers(viewId) {
        var selector = ".popover";
        if (viewId != null) selector += ".view_" + viewId;
        selector += ",.kyrixtooltip";
        d3.selectAll(selector).remove();
    }

    function removePopoversSmooth(viewId) {
        var selector = ".popover";
        if (viewId != null) selector += ".view_" + viewId;
        selector += ",.kyrixtooltip";
        d3.selectAll(selector)
            .transition()
            .duration(param.popoverOutDuration)
            .style("opacity", 0)
            .remove();
    }

    // disable and remove stuff before jump
    function preJump(viewId, jump) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        // execute jumpstart events
        if (gvd.onJumpstartHandlers != null) {
            var subEvts = Object.keys(gvd.onJumpstartHandlers);
            for (var subEvt of subEvts)
                if (typeof gvd.onJumpstartHandlers[subEvt] == "function")
                    gvd.onJumpstartHandlers[subEvt](jump);
        }

        // unbind zoom
        d3.select(viewClass + ".maing").on(".zoom", null);

        // use transition to remove axes, static trims & popovers
        d3.select(viewClass + ".axesg")
            .transition()
            .duration(param.axesOutDuration)
            .style("opacity", 0);
        removePopoversSmooth(viewId);

        // change .mainsvg to .oldmainsvg, and .layerg to .oldlayerg
        d3.selectAll(viewClass + ".oldlayerg").remove();
        d3.selectAll(viewClass + ".layerg")
            .classed("layerg", false)
            .classed("oldlayerg", true);

        d3.selectAll(viewClass + ".mainsvg")
            .classed("mainsvg", false)
            .classed("oldmainsvg", true);

        // remove cursor pointers and onclick listeners
        d3.select(viewClass + ".viewsvg")
            .selectAll("*")
            .style("cursor", "auto")
            .on("click", null)
            .on(".kyrixtooltip", null);
        d3.selectAll("button" + viewClass).attr("disabled", true);

        gvd.animation = jump.type;
        gvd.initialScale = null;
    }

    function postJump(viewId, jump) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;
        var jumpType = jump.type;

        function postOldLayerRemoval() {
            // set up zoom
            if (jumpType == param.literalZoomOut)
                setupZoom(
                    viewId,
                    Math.max(
                        gvd.curCanvas.zoomInFactorX,
                        gvd.curCanvas.zoomInFactorY
                    ) - param.eps
                );
            // hardcode for load for now
            // in the future we shouldn't need these if-elses
            // gvd.initialScale should be set prior to all jumps.
            // relevant: https://github.com/tracyhenry/Kyrix/issues/12
            else setupZoom(viewId, gvd.initialScale || 1);

            // set up button states
            setBackButtonState(viewId);

            // animation stopped now
            gvd.animation = false;

            // register jumps after every jump
            // reason: some coordination-based jumps maybe become applicable after a jump
            for (var i = 0; i < globalVar.project.views.length; i++) {
                var nViewId = globalVar.project.views[i].id;
                var nGvd = globalVar.views[nViewId];
                var nViewClass = ".view_" + nViewId;
                for (var j = 0; j < nGvd.curCanvas.layers.length; j++) {
                    var curLayer = nGvd.curCanvas.layers[j];
                    if (
                        !curLayer.isStatic &&
                        curLayer.fetchingScheme == "tiling"
                    )
                        d3.select(nViewClass + ".layerg.layer" + j)
                            .select("svg")
                            .selectAll(".lowestsvg")
                            .each(function() {
                                registerJumps(nViewId, d3.select(this), j);
                            });
                    else
                        registerJumps(
                            nViewId,
                            d3
                                .select(nViewClass + ".layerg.layer" + j)
                                .select("svg"),
                            j
                        );
                }
            }
        }

        // set the viewBox & opacity of the new .mainsvgs
        // because d3 tween does not get t to 1.0
        d3.selectAll(viewClass + ".mainsvg:not(.static)")
            .attr(
                "viewBox",
                gvd.initialViewportX +
                    " " +
                    gvd.initialViewportY +
                    " " +
                    gvd.viewportWidth +
                    " " +
                    gvd.viewportHeight
            )
            .style("opacity", 1);
        d3.selectAll(viewClass + ".mainsvg.static")
            .attr(
                "viewBox",
                "0 0 " + gvd.viewportWidth + " " + gvd.viewportHeight
            )
            .style("opacity", 1);

        // display axes
        d3.select(viewClass + ".axesg")
            .transition()
            .duration(param.axesInDuration)
            .style("opacity", 1);

        // remove old layers if appropriate
        if (
            !(
                jumpType == param.geometricSemanticZoom ||
                jumpType == param.literalZoomIn ||
                jumpType == param.literalZoomOut ||
                jumpType == param.load
            )
        )
            d3.selectAll(viewClass + ".oldlayerg").remove();

        // check if all layers are static
        var hasDynamic = false;
        for (var i = 0; i < gvd.curCanvas.layers.length; i++)
            if (!gvd.curCanvas.layers[i].isStatic) hasDynamic = true;
        if (!hasDynamic)
            d3.selectAll(viewClass + ".oldlayerg")
                .transition(param.literalZoomFadeOutDuration)
                .style("opacity", 0)
                .remove();

        postOldLayerRemoval();

        // execute on jump handlers
        if (gvd.onJumpendHandlers != null) {
            var subEvts = Object.keys(gvd.onJumpendHandlers);
            for (var subEvt of subEvts)
                if (typeof gvd.onJumpendHandlers[subEvt] == "function")
                    gvd.onJumpendHandlers[subEvt](jump);
        }
    }

    // animate semantic jumps (semantic_zoom, geometric_semantic_zoom, slide)
    function semanticJump(viewId, jump, predArray, newVpX, newVpY, tuple) {
        var gvd = globalVar.views[viewId];

        // log history
        logHistory(viewId, jump);

        // disable stuff before animation
        preJump(viewId, jump);

        // change global vars
        gvd.curCanvasId = jump.destId;
        gvd.predicates = predArray;
        gvd.highlightPredicates = [];
        gvd.initialViewportX = newVpX;
        gvd.initialViewportY = newVpY;

        // prefetch canvas object by sending an async request to server
        var postData = "id=" + gvd.curCanvasId;
        for (var i = 0; i < gvd.predicates.length; i++)
            postData +=
                "&predicate" + i + "=" + getSqlPredicate(gvd.predicates[i]);
        if (!(postData in globalVar.cachedCanvases)) {
            $.ajax({
                type: "GET",
                url: globalVar.serverAddr + "/canvas",
                data: postData,
                success: function(data, status) {
                    if (!(postData in globalVar.cachedCanvases)) {
                        globalVar.cachedCanvases[postData] = {};
                        globalVar.cachedCanvases[
                            postData
                        ].canvasObj = JSON.parse(data).canvas;
                        globalVar.cachedCanvases[postData].jumps = JSON.parse(
                            data
                        ).jump;
                        globalVar.cachedCanvases[
                            postData
                        ].staticData = JSON.parse(data).staticData;
                    }
                },
                async: true
            });
        }

        // animate semantic zoom
        if (
            jump.type == param.semanticZoom ||
            jump.type == param.geometricSemanticZoom
        )
            animateSemanticZoom(viewId, jump, newVpX, newVpY, tuple);
        else if (jump.type == param.slide)
            animateSlide(viewId, jump.slideDirection, newVpX, newVpY, 1, jump);
    }

    function load(predArray, newVpX, newVpY, newScale, viewId, canvasId, jump) {
        var destViewId = viewId;
        logHistory(viewId, jump);

        // stop any tweens
        d3.selection().interrupt("zoomInTween_" + destViewId);
        d3.selection().interrupt("enterTween_" + destViewId);
        d3.selection().interrupt("zoomOutTween_" + destViewId);
        d3.selection().interrupt("fadeTween_" + destViewId);
        d3.selection().interrupt("literalTween_" + destViewId);

        // pre animation
        preJump(destViewId, jump);

        // reset global vars
        var gvd = globalVar.views[destViewId];
        gvd.curCanvasId = canvasId;
        gvd.predicates = predArray;
        gvd.highlightPredicates = [];
        gvd.initialViewportX = newVpX;
        gvd.initialViewportY = newVpY;
        gvd.initialScale = newScale;
        gvd.renderData = null;
        gvd.pendingBoxRequest = null;

        // draw buttons because they were not created if it was an empty view
        drawZoomButtons(destViewId);

        // fetch static data from server, then render the view
        var gotCanvas = getCurCanvas(destViewId);
        gotCanvas.then(function() {
            // render static layers
            renderStaticLayers(destViewId);
            // post animation
            postJump(destViewId, jump);
        });
    }

    function highlight(predArray, jump) {
        var destViewId = jump.destViewId;
        var gvd = globalVar.views[destViewId];
        if (gvd.curCanvasId != jump.destId) return;
        gvd.highlightPredicates = predArray;
        for (var i = 0; i < gvd.curCanvas.layers.length; i++)
            d3.selectAll(".view_" + destViewId + ".layerg.layer" + i)
                .selectAll(".lowestsvg")
                .each(function() {
                    highlightLowestSvg(destViewId, d3.select(this), i);
                });
    }

    // trigger jump on object [d], assuming this jump is applicable on d
    function startJump(viewId, d, jump, optionalArgs) {
        removePopovers(viewId);

        // calculate new predicates
        var predDict = jump.predicates.parseFunction()(d, optionalArgs);
        var predArray = [];
        var numLayer = getCanvasById(jump.destId).layers.length;
        for (var i = 0; i < numLayer; i++)
            if ("layer" + i in predDict) predArray.push(predDict["layer" + i]);
            else predArray.push({});

        // calculate new viewport
        var newVpX, newVpY;
        if (jump.viewport.length > 0) {
            var viewportFunc = jump.viewport.parseFunction();
            var viewportFuncRet = viewportFunc(d, optionalArgs);

            if ("constant" in viewportFuncRet) {
                // constant viewport, no predicate
                newVpX = viewportFuncRet["constant"][0];
                newVpY = viewportFuncRet["constant"][1];
            } else if ("centroid" in viewportFuncRet) {
                //TODO: this is not tested
                // viewport is fixed at a certain tuple
                var postData = "canvasId=" + jump.destId;
                var predDict = viewportFuncRet["centroid"];
                for (var i = 0; i < numLayer; i++)
                    if ("layer" + i in predDict)
                        postData +=
                            "&predicate" +
                            i +
                            "=" +
                            getSqlPredicate(predDict["layer" + i]);
                    else postData += "&predicate" + i + "=";
                $.ajax({
                    type: "GET",
                    url: globalVar.serverAddr + "/viewport",
                    data: postData,
                    success: function(data, status) {
                        var cx = JSON.parse(data).cx;
                        var cy = JSON.parse(data).cy;
                        newVpX = cx - gvd.viewportWidth / 2;
                        newVpY = cy - gvd.viewportHeight / 2;
                    },
                    async: false
                });
            } else
                throw new Error(
                    "Unrecognized new viewport function return value."
                );
        }

        if (
            jump.type == param.semanticZoom ||
            jump.type == param.geometricSemanticZoom ||
            jump.type == param.slide
        )
            semanticJump(viewId, jump, predArray, newVpX, newVpY, d);
        else if (jump.type == param.load)
            load(
                predArray,
                newVpX,
                newVpY,
                1,
                jump.destViewId,
                jump.destId,
                jump
            );
        else if (jump.type == param.highlight) highlight(predArray, jump);
    }

    // register jump info
    function registerJumps(viewId, svg, layerId) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        var jumps = gvd.curJump;
        var shapes = svg.select("g:last-of-type").selectAll("*");
        var optionalArgs = getOptionalArgs(viewId);
        optionalArgs["layerId"] = layerId;

        shapes.each(function(p) {
            // check if this shape has jumps
            var hasJump = false;
            for (var k = 0; k < jumps.length; k++)
                if (
                    (jumps[k].type == param.semanticZoom ||
                        jumps[k].type == param.geometricSemanticZoom ||
                        jumps[k].type == param.slide ||
                        (jumps[k].type == param.load &&
                            jumps[k].sourceViewId == viewId) ||
                        (jumps[k].type == param.highlight &&
                            jumps[k].sourceViewId == viewId &&
                            globalVar.views[jumps[k].destViewId].curCanvasId ==
                                jumps[k].destId)) &&
                    jumps[k].selector.parseFunction()(p, optionalArgs)
                ) {
                    hasJump = true;
                    break;
                }
            if (!hasJump) return;

            // make cursor a hand when hovering over this shape
            d3.select(this).style("cursor", "zoom-in");

            // register onclick listener
            d3.select(this).on("click", function(d) {
                // stop the click event from propagating up
                d3.event.stopPropagation();

                // remove all popovers first
                removePopovers(viewId);

                // create a jumpoption popover using bootstrap
                d3.select("body")
                    .append("div")
                    .classed(
                        "view_" + viewId + " jumppopover popover fade right in",
                        true
                    )
                    .attr("role", "tooltip")
                    .append("div")
                    .classed("view_" + viewId + " popoverarrow arrow", true);
                d3.select(viewClass + ".jumppopover")
                    .append("h2")
                    .classed("view_" + viewId + " popover-title", true)
                    .html("Jump Options")
                    .append("a")
                    .classed("view_" + viewId + " popoverclose close", true)
                    .attr("href", "#")
                    .html("&times;")
                    .on("click", function() {
                        removePopovers(viewId);
                    });
                d3.select(viewClass + ".jumppopover")
                    .append("div")
                    .classed(
                        "view_" +
                            viewId +
                            " popovercontent popover-content list-group",
                        true
                    );

                // add jump options
                for (var k = 0; k < jumps.length; k++) {
                    // check if this jump is applied in this layer
                    if (
                        (jumps[k].type != param.semanticZoom &&
                            jumps[k].type != param.geometricSemanticZoom &&
                            jumps[k].type != param.slide &&
                            (jumps[k].type != param.load ||
                                jumps[k].sourceViewId != viewId) &&
                            (jumps[k].type != param.highlight ||
                                jumps[k].sourceViewId != viewId ||
                                globalVar.views[jumps[k].destViewId]
                                    .curCanvasId != jumps[k].destId)) ||
                        !jumps[k].selector.parseFunction()(d, optionalArgs)
                    )
                        continue;

                    // create table cell and append it to .popovercontent
                    var optionText = "<b>ZOOM IN </b>";
                    if (jumps[k].type == param.load)
                        optionText =
                            "<b>LOAD " +
                            jumps[k].destViewId +
                            " VIEW with </b>";
                    else if (jumps[k].type == param.highlight)
                        optionText =
                            "<b>HIGHLIGHT in " +
                            jumps[k].destViewId +
                            " VIEW </b>";
                    if (jumps[k].noPrefix == true) {
                        optionText = "";
                    }
                    optionText +=
                        jumps[k].name.parseFunction() == null
                            ? jumps[k].name
                            : jumps[k].name.parseFunction()(d, optionalArgs);
                    var jumpOption = d3
                        .select(viewClass + ".popovercontent")
                        .append("a")
                        .classed("list-group-item", true)
                        .attr("href", "#")
                        .datum(d)
                        .attr("data-jump-id", k)
                        .html(optionText);

                    // on click
                    jumpOption.on("click", function(d) {
                        d3.event.preventDefault();
                        var jump = jumps[d3.select(this).attr("data-jump-id")];
                        startJump(viewId, d, jump, optionalArgs);
                    });
                }

                // position jump popover according to event x/y and its width/height
                var popoverHeight = d3
                    .select(viewClass + ".jumppopover")
                    .node()
                    .getBoundingClientRect().height;
                d3.select(viewClass + ".jumppopover")
                    .style("left", d3.event.pageX + "px")
                    .style("top", d3.event.pageY - popoverHeight / 2 + "px");
            });
        });
    }
    function animateSemanticZoom(viewId, jump, newVpX, newVpY, tuple) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        // whether this semantic zoom is also geometric
        var enteringAnimation = jump.type == param.semanticZoom ? true : false;

        // calculate tuple boundary
        var curViewport = [0, 0, gvd.viewportWidth, gvd.viewportHeight];
        if (d3.select(viewClass + ".oldmainsvg:not(.static)").size())
            curViewport = d3
                .select(viewClass + ".oldmainsvg:not(.static)")
                .attr("viewBox")
                .split(" ");
        for (var i = 0; i < curViewport.length; i++)
            curViewport[i] = +curViewport[i];
        if (
            !("minx" in tuple) ||
            !("miny" in tuple) ||
            !("maxx" in tuple) ||
            !("maxy" in tuple)
        )
            tuple.minx = tuple.miny = tuple.maxx = tuple.maxy = 0;
        var tupleWidth = +tuple.maxx - tuple.minx;
        var tupleHeight = +tuple.maxy - tuple.miny;
        var minx, maxx, miny, maxy;
        if (tupleWidth == 0 || tupleHeight == 0) {
            // check when placement func does not exist
            minx = gvd.curCanvas.w;
            miny = gvd.curCanvas.h;
            maxx = maxy = 0;
            d3.select(viewClass + ".viewsvg")
                .selectAll("*")
                .filter(function(d) {
                    return d == tuple;
                })
                .each(function() {
                    // find the parent main g
                    var ancestor = this.parentElement;
                    while (!ancestor.classList.contains("maing"))
                        ancestor = ancestor.parentElement;

                    // get client dx & dy
                    var thisBox = this.getBoundingClientRect();
                    var ancestorBox = d3
                        .select(ancestor)
                        .select("rect")
                        .node()
                        .getBoundingClientRect();
                    var dx = thisBox.x - ancestorBox.x;
                    var dy = thisBox.y - ancestorBox.y;

                    // because here we use client coordinates to infer svg coordinates,
                    // we need to multiply a scale factor
                    // which is how much the svg viewport has been scaled,
                    // which equals to curViewport[2] / viewW
                    var viewW = d3.select(viewClass + ".viewsvg").attr("width");
                    var curViewport = d3
                        .select(viewClass + ".viewsvg")
                        .attr("viewBox");
                    var curViewportW =
                        curViewport == null ? viewW : curViewport.split(" ")[2];
                    var m = curViewportW / viewW;

                    // now get minx, miny, maxx, maxy
                    minx = Math.min(minx, dx * m);
                    miny = Math.min(miny, dy * m);
                    maxx = Math.max(maxx, (dx + thisBox.width) * m);
                    maxy = Math.max(maxy, (dy + thisBox.height) * m);
                });
        } else {
            minx = +tuple.cx - tupleWidth / 2.0;
            maxx = +tuple.cx + tupleWidth / 2.0;
            miny = +tuple.cy - tupleHeight / 2.0;
            maxy = +tuple.cy + tupleHeight / 2.0;
        }

        // use tuple boundary to calculate start and end views, and log them to the last history object
        var startView = [
            curViewport[2] / 2.0,
            curViewport[3] / 2.0,
            curViewport[2]
        ];
        var endView = [
            minx + (maxx - minx) / 2.0 - curViewport[0],
            miny + (maxy - miny) / 2.0 - curViewport[1],
            (maxx - minx) /
                (enteringAnimation ? param.semanticZoomScaleFactor : 1)
        ];
        gvd.history[gvd.history.length - 1].startView = startView;
        gvd.history[gvd.history.length - 1].endView = endView;

        // set up zoom transitions
        param.zoomDuration = d3.interpolateZoom(startView, endView).duration;
        param.enteringDelay = Math.round(
            param.zoomDuration * param.semanticZoomEnteringDelta
        );
        d3.transition("zoomInTween_" + viewId)
            .duration(param.zoomDuration)
            .tween("zoomInTween", function() {
                var i = d3.interpolateZoom(startView, endView);
                return function(t) {
                    zoomAndFade(t, i(t));
                };
            })
            .ease(d3.easeSinOut)
            .on("start", function() {
                // schedule a new entering transition
                if (enteringAnimation)
                    d3.transition("enterTween_" + viewId)
                        .delay(param.enteringDelay)
                        .duration(param.semanticZoomEnteringDuration)
                        .tween("enterTween", function() {
                            return function(t) {
                                enterAndScale(d3.easeCircleOut(t));
                            };
                        })
                        .on("start", function() {
                            // get the canvas object for the destination canvas
                            var gotCanvas = getCurCanvas(viewId);
                            gotCanvas.then(function() {
                                // static trim
                                renderStaticLayers(viewId);

                                // render
                                RefreshDynamicLayers(viewId, newVpX, newVpY);
                            });
                        })
                        .on("end", function() {
                            postJump(viewId, jump);
                        });
            })
            .on("end", function() {
                if (!enteringAnimation) {
                    // get the canvas object for the destination canvas
                    var gotCanvas = getCurCanvas(viewId);
                    gotCanvas.then(function() {
                        // static trim
                        renderStaticLayers(viewId);

                        // render
                        RefreshDynamicLayers(viewId, newVpX, newVpY);

                        // clean up
                        postJump(viewId, jump);
                    });
                }
            });

        function zoomAndFade(t, v) {
            var vWidth = v[2];
            var vHeight = (gvd.viewportHeight / gvd.viewportWidth) * vWidth;
            var minx = curViewport[0] + v[0] - vWidth / 2.0;
            var miny = curViewport[1] + v[1] - vHeight / 2.0;

            // change viewBox of dynamic layers
            d3.selectAll(viewClass + ".oldmainsvg:not(.static)").attr(
                "viewBox",
                minx + " " + miny + " " + vWidth + " " + vHeight
            );

            // change viewBox of static layers
            minx = v[0] - vWidth / 2.0;
            miny = v[1] - vHeight / 2.0;
            var k = gvd.viewportWidth / curViewport[2];
            d3.selectAll(viewClass + ".oldmainsvg.static").attr(
                "viewBox",
                minx * k + " " + miny * k + " " + vWidth * k + " " + vHeight * k
            );

            // change opacity
            if (enteringAnimation) {
                var threshold = param.fadeThreshold;
                if (t >= threshold) {
                    d3.selectAll(viewClass + ".oldmainsvg").style(
                        "opacity",
                        1.0 - (t - threshold) / (1.0 - threshold)
                    );
                }
            }
        }

        function enterAndScale(t) {
            var vWidth =
                (gvd.viewportWidth * param.enteringScaleFactor) /
                (1.0 + (param.enteringScaleFactor - 1.0) * t);
            var vHeight =
                (gvd.viewportHeight * param.enteringScaleFactor) /
                (1.0 + (param.enteringScaleFactor - 1.0) * t);
            var minx = newVpX + gvd.viewportWidth / 2.0 - vWidth / 2.0;
            var miny = newVpY + gvd.viewportHeight / 2.0 - vHeight / 2.0;

            // change viewBox of dynamic layers
            d3.selectAll(viewClass + ".mainsvg:not(.static)").attr(
                "viewBox",
                minx + " " + miny + " " + vWidth + " " + vHeight
            );

            // change viewbox of static layers
            minx = gvd.viewportWidth / 2 - vWidth / 2;
            miny = gvd.viewportHeight / 2 - vHeight / 2;
            d3.selectAll(viewClass + ".mainsvg.static").attr(
                "viewBox",
                minx + " " + miny + " " + vWidth + " " + vHeight
            );

            // change opacity
            d3.selectAll(viewClass + ".mainsvg").style("opacity", t);
        }
    }

    function animateBackspaceSemanticZoom(viewId, jump, startView, endView) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        // get current viewport
        var curViewport = [0, 0, gvd.viewportWidth, gvd.viewportHeight];
        if (d3.select(viewClass + ".oldmainsvg:not(.static)").size())
            curViewport = d3
                .select(viewClass + ".oldmainsvg:not(.static)")
                .attr("viewBox")
                .split(" ");

        // whether this semantic zoom is also geometric
        var fadingAnimation = jump.type == param.semanticZoom ? true : false;

        // start a exit & fade transition
        if (fadingAnimation)
            d3.transition("fadeTween_" + viewId)
                .duration(param.semanticZoomEnteringDuration)
                .tween("fadeTween", function() {
                    return function(t) {
                        fadeAndExit(d3.easeCircleOut(1 - t));
                    };
                })
                .on("start", startZoomingBack);
        else {
            for (var i = 0; i < gvd.curCanvas.layers.length; i++)
                if (gvd.curCanvas.layers[i].isStatic)
                    d3.selectAll(
                        viewClass + ".oldlayerg" + ".layer" + i
                    ).remove();
            startZoomingBack();
        }

        function startZoomingBack() {
            // schedule a zoom back transition
            var zoomDuration = d3.interpolateZoom(endView, startView).duration;
            var enteringDelay = Math.max(
                Math.round(zoomDuration * param.semanticZoomEnteringDelta) +
                    param.semanticZoomEnteringDuration -
                    zoomDuration,
                param.axesOutDuration
            );
            if (!fadingAnimation) enteringDelay = 0;
            d3.transition("zoomOutTween_" + viewId)
                .delay(enteringDelay)
                .duration(zoomDuration)
                .tween("zoomOutTween", function() {
                    var i = d3.interpolateZoom(endView, startView);
                    return function(t) {
                        enterAndZoom(t, i(t));
                    };
                })
                .ease(d3.easeSinIn)
                .on("start", function() {
                    // set up layer layouts
                    setupLayerLayouts(viewId);

                    // static trim
                    renderStaticLayers(viewId);

                    // render
                    RefreshDynamicLayers(
                        viewId,
                        gvd.initialViewportX,
                        gvd.initialViewportY
                    );
                })
                .on("end", function() {
                    postJump(viewId, jump);
                });
        }

        function enterAndZoom(t, v) {
            var vWidth = v[2];
            var vHeight = (gvd.viewportHeight / gvd.viewportWidth) * vWidth;
            var minx = gvd.initialViewportX + v[0] - vWidth / 2.0;
            var miny = gvd.initialViewportY + v[1] - vHeight / 2.0;

            // change viewBox of dynamic layers
            d3.selectAll(viewClass + ".mainsvg:not(.static)").attr(
                "viewBox",
                minx + " " + miny + " " + vWidth + " " + vHeight
            );

            // change viewBox of static layers
            minx = v[0] - vWidth / 2.0;
            miny = v[1] - vHeight / 2.0;
            var k = gvd.initialScale || 1;
            d3.selectAll(viewClass + ".mainsvg.static").attr(
                "viewBox",
                minx * k + " " + miny * k + " " + vWidth * k + " " + vHeight * k
            );

            // change opacity
            if (fadingAnimation) {
                var threshold = param.fadeThreshold;
                if (1 - t >= threshold) {
                    d3.selectAll(viewClass + ".mainsvg").style(
                        "opacity",
                        1.0 - (1 - t - threshold) / (1.0 - threshold)
                    );
                }
            }
        }

        function fadeAndExit(t) {
            var vWidth =
                (gvd.viewportWidth * param.enteringScaleFactor) /
                (1.0 + (param.enteringScaleFactor - 1.0) * t);
            var vHeight =
                (gvd.viewportHeight * param.enteringScaleFactor) /
                (1.0 + (param.enteringScaleFactor - 1.0) * t);
            var minx = +curViewport[0] + gvd.viewportWidth / 2.0 - vWidth / 2.0;
            var miny =
                +curViewport[1] + gvd.viewportHeight / 2.0 - vHeight / 2.0;

            // change viewBox of old dynamic layers
            // TODO: this'll probably fail when zooming back from a literal zoom canvas
            d3.selectAll(viewClass + ".oldmainsvg:not(.static)").attr(
                "viewBox",
                minx + " " + miny + " " + vWidth + " " + vHeight
            );

            // change viewBox of old static layers
            minx = gvd.viewportWidth / 2 - vWidth / 2;
            miny = gvd.viewportHeight / 2 - vHeight / 2;
            d3.selectAll(viewClass + ".oldmainsvg.static").attr(
                "viewBox",
                minx + " " + miny + " " + vWidth + " " + vHeight
            );

            // change opacity
            d3.selectAll(viewClass + ".oldmainsvg").style("opacity", t);
        }
    }

    function animateSlide(
        viewId,
        slideDirection,
        newVpX,
        newVpY,
        newScale,
        jump
    ) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        // curViewport
        var curViewport = [0, 0, gvd.viewportWidth, gvd.viewportHeight];
        if (d3.select(viewClass + ".oldmainsvg:not(.static)").size())
            curViewport = d3
                .select(viewClass + ".oldmainsvg:not(.static)")
                .attr("viewBox")
                .split(" ");
        for (var i = 0; i < curViewport.length; i++)
            curViewport[i] = +curViewport[i];

        // setup direction, sine and cosine
        var dir = ((360 - slideDirection) / 180) * Math.PI;
        var cos = Math.cos(dir);
        var sin = Math.sin(dir);

        // start transition
        // exit transition
        d3.transition("zoomInTween_" + viewId)
            .duration(
                //param.slideExitDuration / Math.max(Math.abs(cos), Math.abs(sin))
                param.slideEnteringDuration
            )
            .tween("zoomInTween", function() {
                return function(t) {
                    exit(t);
                };
            })
            .ease(d3.easeSinOut);

        if (jump.slideSuperman) {
            // cloud svg
            var cloudSvg = d3
                .select(viewClass + ".oldlayerg")
                .append("svg")
                .attr(
                    "viewBox",
                    "0 0 " + gvd.viewportWidth + " " + gvd.viewportHeight
                )
                .attr("width", gvd.viewportWidth)
                .attr("height", gvd.viewportHeight)
                .style("opacity", 0)
                .attr("id", "cloudsvg");

            // append the images
            var imgWidth = 256;
            var imgHeight = 256;
            var cx = gvd.viewportWidth / 2.0;
            var cy = gvd.viewportHeight / 2.0;
            var dx1 = Math.abs(imgHeight * cos * 1.5);
            var dy1 = Math.abs(imgHeight * sin * 1.5);
            var dx2 = Math.abs(imgWidth * sin * 1.5);
            var dy2 = Math.abs(imgHeight * cos * 1.5);
            for (var i = -10; i < 10; i++)
                for (var j = -10; j < 10; j++) {
                    var curX = cx + i * dx1 + i * dx2 + imgWidth;
                    var curY = cy + j * dy1 + j * dy2 + imgHeight;
                    cloudSvg
                        .append("image")
                        .attr("x", curX - imgWidth / 2.0)
                        .attr("y", curY - imgHeight / 2.0)
                        .attr("width", imgWidth)
                        .attr("height", imgHeight)
                        .attr(
                            "xlink:href",
                            "https://live.staticflickr.com/65535/49735371613_70cb0051b2_b.jpg"
                        )
                        .attr(
                            "transform",
                            "rotate(" +
                                (slideDirection > 90 && slideDirection < 270
                                    ? 360 - ((slideDirection + 180) % 360)
                                    : 360 - slideDirection) +
                                ", " +
                                curX +
                                ", " +
                                curY +
                                ")"
                        );
                }

            var supermanSvg = d3
                .select(viewClass + ".oldlayerg")
                .append("svg")
                .attr("id", "supermansvg")
                .attr("width", gvd.viewportWidth)
                .attr("height", gvd.viewportHeight)
                .append("image")
                .attr("x", gvd.viewportWidth / 2 - 150)
                .attr("y", gvd.viewportHeight / 2 - 150)
                .attr("width", 300)
                .attr("height", 300)
                .style("opacity", 0);
            if (slideDirection > 90 && slideDirection < 270)
                supermanSvg
                    .attr(
                        "xlink:href",
                        "https://live.staticflickr.com/65535/49735899041_e6c9d13323_o.png"
                    )
                    .attr(
                        "transform",
                        "rotate(" +
                            ((145 - slideDirection + 360) % 360) +
                            ", " +
                            gvd.viewportWidth / 2 +
                            ", " +
                            gvd.viewportHeight / 2 +
                            ")"
                    );
            else
                supermanSvg
                    .attr(
                        "xlink:href",
                        "https://live.staticflickr.com/65535/49735448721_e0ea4f763f_o.png"
                    )
                    .attr(
                        "transform",
                        "rotate(" +
                            ((35 - slideDirection + 360) % 360) +
                            ", " +
                            gvd.viewportWidth / 2 +
                            ", " +
                            gvd.viewportHeight / 2 +
                            ")"
                    );

            d3.transition("cloudTween_" + viewId)
                .duration(param.supermanFlyingDuration)
                .ease(d3.easeLinear)
                .tween("cloudTween", function() {
                    return function(t) {
                        travel(t);
                    };
                })
                .on("start", function() {
                    supermanSvg
                        .transition()
                        .delay(param.supermanDisplayDelay)
                        .duration(param.supermanDisplayDuration)
                        .style("opacity", 1);

                    cloudSvg
                        .transition()
                        .delay(param.supermanDisplayDelay)
                        .duration(param.supermanDisplayDuration)
                        .style("opacity", 1);
                })
                .on("end", function() {
                    supermanSvg.remove();
                    cloudSvg.remove();
                });
        }

        // schedule a new entering transition
        d3.transition("enterTween_" + viewId)
            .delay(
                jump.slideSuperman
                    ? param.supermanFlyingDuration - param.supermanEnteringTime
                    : param.slideSwitchDelay
            )
            .duration(param.slideEnteringDuration)
            .ease(d3.easeSinIn)
            .tween("enterTween", function() {
                return function(t) {
                    enter(t);
                };
            })
            .on("start", function() {
                if (jump.slideSuperman) {
                    cloudSvg
                        .transition()
                        .duration(400)
                        .style("opacity", 0);
                }

                // get the canvas object for the destination canvas
                var gotCanvas = getCurCanvas(viewId);
                gotCanvas.then(function() {
                    // static trim
                    renderStaticLayers(viewId);

                    // render
                    RefreshDynamicLayers(viewId, newVpX, newVpY);
                });
            })
            .on("end", function() {
                postJump(viewId, jump);
            });

        function exit(t) {
            var minx, miny;
            if (Math.abs(cos) > Math.abs(sin)) {
                minx = curViewport[0] + curViewport[2] * t * (cos > 0 ? 1 : -1);
                miny =
                    curViewport[1] +
                    ((curViewport[2] * t) / Math.abs(cos)) * sin;
            } else {
                miny = curViewport[1] + curViewport[3] * t * (sin > 0 ? 1 : -1);
                minx =
                    curViewport[0] +
                    ((curViewport[3] * t) / Math.abs(sin)) * cos;
            }

            // change viewBox of dynamic layers
            d3.selectAll(viewClass + ".oldmainsvg:not(.static)")
                .attr(
                    "viewBox",
                    minx +
                        " " +
                        miny +
                        " " +
                        curViewport[2] +
                        " " +
                        curViewport[3]
                )
                .style("opacity", 1 - t);

            // change viewBox of static layers
            if (Math.abs(cos) > Math.abs(sin)) {
                minx = gvd.viewportWidth * t * (cos > 0 ? 1 : -1);
                miny = ((gvd.viewportWidth * t) / Math.abs(cos)) * sin;
            } else {
                miny = gvd.viewportHeight * t * (sin > 0 ? 1 : -1);
                minx = ((gvd.viewportHeight * t) / Math.abs(sin)) * cos;
            }
            d3.selectAll(viewClass + ".oldmainsvg.static")
                .attr(
                    "viewBox",
                    minx +
                        " " +
                        miny +
                        " " +
                        gvd.viewportWidth +
                        " " +
                        gvd.viewportHeight
                )
                .style("opacity", 1 - t);
        }

        function enter(t) {
            var minx, miny;
            if (Math.abs(cos) > Math.abs(sin)) {
                minx =
                    newVpX -
                    (curViewport[2] * (1 - t) * (cos > 0 ? 1 : -1)) / newScale;
                miny =
                    newVpY -
                    (((curViewport[2] * (1 - t)) / Math.abs(cos)) * sin) /
                        newScale;
            } else {
                miny =
                    newVpY -
                    (curViewport[3] * (1 - t) * (sin > 0 ? 1 : -1)) / newScale;
                minx =
                    newVpX -
                    (((curViewport[3] * (1 - t)) / Math.abs(sin)) * cos) /
                        newScale;
            }

            // change viewBox of dynamic layers
            d3.selectAll(viewClass + ".mainsvg:not(.static)")
                .attr(
                    "viewBox",
                    minx +
                        " " +
                        miny +
                        " " +
                        gvd.viewportWidth / newScale +
                        " " +
                        gvd.viewportHeight / newScale
                )
                .style("opacity", t);

            // change viewbox of static layers
            if (Math.abs(cos) > Math.abs(sin)) {
                minx = -gvd.viewportWidth * (1 - t) * (cos > 0 ? 1 : -1);
                miny = ((-gvd.viewportWidth * (1 - t)) / Math.abs(cos)) * sin;
            } else {
                miny = -gvd.viewportHeight * (1 - t) * (sin > 0 ? 1 : -1);
                minx = ((-gvd.viewportHeight * (1 - t)) / Math.abs(sin)) * cos;
            }
            d3.selectAll(viewClass + ".mainsvg.static")
                .attr(
                    "viewBox",
                    minx +
                        " " +
                        miny +
                        " " +
                        gvd.viewportWidth +
                        " " +
                        gvd.viewportHeight
                )
                .style("opacity", t);
        }

        function travel(t) {
            // change viewbox of static layers
            var minx, miny;
            if (Math.abs(cos) > Math.abs(sin)) {
                minx = -gvd.viewportWidth * (1 - 2 * t) * (cos > 0 ? 1 : -1);
                miny =
                    ((-gvd.viewportWidth * (1 - 2 * t)) / Math.abs(cos)) * sin;
            } else {
                miny = -gvd.viewportHeight * (1 - 2 * t) * (sin > 0 ? 1 : -1);
                minx =
                    ((-gvd.viewportHeight * (1 - 2 * t)) / Math.abs(sin)) * cos;
            }
            d3.select("#cloudsvg").attr(
                "viewBox",
                minx +
                    " " +
                    miny +
                    " " +
                    gvd.viewportWidth +
                    " " +
                    gvd.viewportHeight
            );
        }
    }
    // parameters
    var param = {};

    // animation durations, delays
    param.semanticZoomEnteringDelta = 0.5;
    param.semanticZoomEnteringDuration = 1300;
    param.slideExitDuration = 700;
    param.slideEnteringDuration = 700;
    param.slideSwitchDelay = 230;
    param.supermanFlyingDuration = 2500;
    param.supermanEnteringTime = 350;
    param.supermanDisplayDelay = 200;
    param.supermanDisplayDuration = 300;
    param.literalZoomDuration = 500;
    param.literalZoomFadeOutDuration = 150;

    // semantic zoom scale factor
    param.semanticZoomScaleFactor = 4;

    // entering initial scale factor
    param.enteringScaleFactor = 2.5;

    // threshold for t when fade starts
    param.fadeThreshold = 0.5;

    // tile entering animation duration
    param.tileEnteringDuration = 150;

    // axes & static trim fading in/out duration
    param.axesOutDuration = 400;
    param.axesInDuration = 400;
    param.staticTrimInDuration = 500;
    param.staticTrimOutDuration = 500;
    param.popoverOutDuration = 200;

    // zoom factor per step (double click, zoom buttons)
    param.literalZoomFactorPerStep = 2;

    // for coordinated highlighting - dim opacity
    param.dimOpacity = 0.4;

    // extra tiles per dimension
    param.extraTiles = 0;

    // padding for .viewsvg
    param.viewPadding = 70;

    // jump types
    param.literalZoomIn = "literal_zoom_in";
    param.literalZoomOut = "literal_zoom_out";
    param.semanticZoom = "semantic_zoom";
    param.geometricSemanticZoom = "geometric_semantic_zoom";
    param.load = "load";
    param.randomJump = "randomJump";
    param.highlight = "highlight";
    param.slide = "slide";

    // epsilon
    param.eps = 1e-5;

    // screen space reserved for buttons
    param.buttonAreaWidth = 90;
    function renderStaticLayers(viewId) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        // if no dynamic layers, render axes
        if (d3.select(viewClass + ".mainsvg:not(.static)").size() == 0)
            renderAxes(viewId, 0, 0, gvd.viewportWidth, gvd.viewportHeight);

        // number of layers
        var numLayers = gvd.curCanvas.layers.length;

        // loop over every layer
        for (var i = numLayers - 1; i >= 0; i--) {
            // current layer object
            var curLayer = gvd.curCanvas.layers[i];

            // if this layer is not static, return
            if (!curLayer.isStatic) continue;

            // render
            var renderFunc = curLayer.rendering.parseFunction();
            var curSvg = d3
                .select(viewClass + ".layerg.layer" + i)
                .select("svg");
            var args = getOptionalArgs(viewId);
            args["layerId"] = i;
            args["ssvId"] = curLayer.ssvId;
            args["usmapId"] = curLayer.usmapId;
            args["staticAggregationId"] = curLayer.staticAggregationId;
            renderFunc(curSvg, gvd.curStaticData[i], args);

            // tooltips
            if (curLayer.tooltipColumns.length > 0)
                makeTooltips(
                    curSvg.selectAll("*"),
                    curLayer.tooltipColumns,
                    curLayer.tooltipAliases
                );

            // register jump
            if (!gvd.animation) registerJumps(viewId, curSvg, i);

            // highlight
            highlightLowestSvg(viewId, curSvg, i);
        }
    }
    function zoomRescale(viewId, ele, oldGScaleX, oldGScaleY) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        var cx = d3.select(ele).datum().cx;
        var cy = d3.select(ele).datum().cy; // finding center of element
        var k = gvd.initialScale || 1;
        if (!gvd.animation)
            k = d3.zoomTransform(d3.select(viewClass + ".maing").node()).k;
        var scaleX = 1 / k;
        var scaleY = 1 / k;

        if (
            gvd.curCanvas.zoomInFactorX <= 1 &&
            gvd.curCanvas.zoomOutFactorX >= 1
        )
            scaleX = 1;
        if (
            gvd.curCanvas.zoomInFactorY <= 1 &&
            gvd.curCanvas.zoomOutFactorY >= 1
        )
            scaleY = 1;
        scaleX *= oldGScaleX ? oldGScaleX : 1;
        scaleY *= oldGScaleY ? oldGScaleY : 1;
        var tx = -cx * (scaleX - 1);
        var ty = -cy * (scaleY - 1);
        var translateStr = tx + "," + ty;
        d3.select(ele).attr(
            "transform",
            "translate(" +
                translateStr +
                ") scale(" +
                scaleX +
                ", " +
                scaleY +
                ")"
        );
    }

    // set up zoom translate & scale extent
    // call zoom on maing
    // reset zoom transform
    // called after every jump
    function setupZoom(viewId, initialScale) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        // record initial scale, used to determine whether it's
        // literal zoom in or literal zoom out
        gvd.initialScale = initialScale;

        // calculate maxScale
        gvd.maxScale = Math.max(
            gvd.curCanvas.zoomInFactorX,
            gvd.curCanvas.zoomInFactorY,
            1
        );

        // set up zoom
        gvd.zoom = d3
            .zoom()
            .scaleExtent([1 - param.eps, gvd.maxScale])
            .on("zoom", function() {
                zoomed(viewId);
            });

        // set up zooms
        d3.select(viewClass + ".maing")
            .call(gvd.zoom)
            .on("dblclick.zoom", function() {
                var mousePos = d3.mouse(this);
                event.preventDefault();
                event.stopImmediatePropagation();
                var zoomFactor =
                    param.literalZoomFactorPerStep * (event.shiftKey ? -1 : 1);
                startLiteralZoomTransition(
                    viewId,
                    mousePos,
                    zoomFactor,
                    param.literalZoomDuration
                );
            })
            .call(gvd.zoom.transform, d3.zoomIdentity.scale(initialScale));
    }

    function startLiteralZoomTransition(viewId, center, scale, duration) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;
        var curSelection = d3.select(viewClass + ".maing");

        // remove popovers
        removePopoversSmooth(viewId);

        // disable cursor pointers, buttons and onclick listeners
        var previousTick = 0;

        // start transition
        d3.transition("literalTween_" + viewId)
            .duration(duration)
            .ease(d3.easeLinear)
            .tween("literalTween", function() {
                return function(t) {
                    var curZoomFactor = Math.pow(
                        Math.abs(scale),
                        t - previousTick
                    );
                    if (scale < 0) curZoomFactor = 1 / curZoomFactor;
                    previousTick = t;
                    var initialZoomTransform = d3.zoomTransform(
                        curSelection.node()
                    );
                    if (initialZoomTransform.k >= gvd.maxScale && scale > 0)
                        return;
                    if (initialZoomTransform.k <= 1 - param.eps && scale < 0)
                        return;
                    var curK = initialZoomTransform.k * curZoomFactor;
                    var curTX =
                        center[0] +
                        curZoomFactor * (-center[0] + initialZoomTransform.x);
                    var curTY =
                        center[1] +
                        curZoomFactor * (-center[1] + initialZoomTransform.y);
                    var curZoomTransform = d3.zoomIdentity
                        .translate(curTX, curTY)
                        .scale(curK);
                    curSelection.call(gvd.zoom.transform, curZoomTransform);
                };
            });
    }

    function completeZoom(viewId, zoomType, oldZoomFactorX, oldZoomFactorY) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        // get the id of the canvas to zoom into
        var jumps = gvd.curJump;
        var curJump = null;
        for (var i = 0; i < jumps.length; i++)
            if (jumps[i].type == zoomType) curJump = jumps[i];
        gvd.curCanvasId = curJump.destId;

        // get new viewport coordinates
        var curViewport = d3
            .select(viewClass + ".mainsvg:not(.static)")
            .attr("viewBox")
            .split(" ");
        gvd.initialViewportX = curViewport[0] * oldZoomFactorX;
        gvd.initialViewportY = curViewport[1] * oldZoomFactorY;

        // TODO (#157): we cleared predicates before literal zoom, but this isn't ideal
        var numLayer = getCanvasById(curJump.destId).layers.length;
        gvd.predicates = [];
        for (var i = 0; i < numLayer; i++) gvd.predicates.push({});

        // pre animation
        preJump(viewId, curJump);

        // get the canvas object
        var gotCanvas = getCurCanvas(viewId);
        gotCanvas.then(function() {
            // render static layers
            renderStaticLayers(viewId);

            // post animation
            postJump(viewId, curJump);
        });
    }

    // listener function for zoom actions
    function zoomed(viewId) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        // no dynamic layers? return
        if (d3.select(viewClass + ".mainsvg:not(.static)").size() == 0) return;

        // frequently accessed global variables
        var cWidth = gvd.curCanvas.w;
        var cHeight = gvd.curCanvas.h;
        var vWidth = gvd.viewportWidth;
        var vHeight = gvd.viewportHeight;
        var iVX = gvd.initialViewportX;
        var iVY = gvd.initialViewportY;
        var zoomInFactorX = gvd.curCanvas.zoomInFactorX;
        var zoomOutFactorX = gvd.curCanvas.zoomOutFactorX;
        var zoomInFactorY = gvd.curCanvas.zoomInFactorY;
        var zoomOutFactorY = gvd.curCanvas.zoomOutFactorY;

        // get current zoom transform
        var transform = d3.event.transform;

        // remove all popovers
        removePopovers(viewId);

        // get scale x and y
        var scaleX = transform.k;
        var scaleY = transform.k;
        if (zoomInFactorX <= 1 && zoomOutFactorX >= 1) scaleX = 1;
        if (zoomInFactorY <= 1 && zoomOutFactorY >= 1) scaleY = 1;

        // get new viewport coordinates
        var viewportX = iVX - transform.x / scaleX;
        var viewportY = iVY - transform.y / scaleY;

        // restrict panning by modifying d3 event transform, which is a bit sketchy. However,
        // d3-zoom is so under-documented that I could not use it to make single-axis literal zooms work
        if (viewportX < 0) {
            viewportX = 0;
            d3.event.transform.x = iVX * scaleX;
        }
        if (viewportX > cWidth - vWidth / scaleX) {
            viewportX = cWidth - vWidth / scaleX;
            d3.event.transform.x = (iVX - viewportX) * scaleX;
        }
        if (viewportY < 0) {
            viewportY = 0;
            d3.event.transform.y = iVY * scaleY;
        }
        if (viewportY > cHeight - vHeight / scaleY) {
            viewportY = cHeight - vHeight / scaleY;
            d3.event.transform.y = (iVY - viewportY) * scaleY;
        }

        // set viewBox
        var curViewport = d3
            .select(viewClass + ".mainsvg:not(.static)")
            .attr("viewBox")
            .split(" ");
        d3.selectAll(viewClass + ".mainsvg:not(.static)").attr(
            "viewBox",
            viewportX +
                " " +
                viewportY +
                " " +
                vWidth / scaleX +
                " " +
                vHeight / scaleY
        );

        // set viewboxes old layer groups
        var jumps = gvd.curJump;
        var zoomType =
            gvd.initialScale == 1 ? param.literalZoomOut : param.literalZoomIn;
        var oldCanvasId = "";
        for (var i = 0; i < jumps.length; i++)
            if (jumps[i].type == zoomType) oldCanvasId = jumps[i].destId;
        if (
            !d3.selectAll(viewClass + ".oldmainsvg:not(.static)").empty() &&
            oldCanvasId != ""
        ) {
            var oldViewportX =
                viewportX *
                (gvd.initialScale == 1 ? zoomOutFactorX : zoomInFactorX);
            var oldViewportY =
                viewportY *
                (gvd.initialScale == 1 ? zoomOutFactorY : zoomInFactorY);
            var oldViewportW =
                vWidth /
                (scaleX /
                    (gvd.initialScale == 1 ? zoomOutFactorX : zoomInFactorX));
            var oldViewportH =
                vHeight /
                (scaleY /
                    (gvd.initialScale == 1 ? zoomOutFactorY : zoomInFactorY));
            d3.selectAll(viewClass + ".oldmainsvg:not(.static)").attr(
                "viewBox",
                oldViewportX +
                    " " +
                    oldViewportY +
                    " " +
                    oldViewportW +
                    " " +
                    oldViewportH
            );
        }

        // check if there is literal zooming going on
        // if yes, rescale the objects
        // do it both here and upon data return
        var isZooming =
            Math.abs(vWidth / scaleX - curViewport[2]) > param.eps ||
            Math.abs(vHeight / scaleY - curViewport[3]) > param.eps;
        if (isZooming) {
            d3.selectAll(viewClass + ".layerg")
                .selectAll(".kyrix-retainsizezoom")
                .each(function() {
                    zoomRescale(viewId, this);
                });

            // for old layer groups
            if (oldCanvasId != "") {
                // proceed when it's indeed literal zoom (otherwise can only be geometric semantic zoom)
                d3.selectAll(viewClass + ".oldlayerg")
                    .selectAll(".kyrix-retainsizezoom")
                    .each(function() {
                        zoomRescale(
                            viewId,
                            this,
                            gvd.initialScale == 1
                                ? zoomOutFactorX
                                : zoomInFactorX,
                            gvd.initialScale == 1
                                ? zoomOutFactorY
                                : zoomInFactorY
                        );
                    });
            }
        }

        // set literal zoom button state
        d3.select(viewClass + ".zoominbutton").attr("disabled", true);
        d3.select(viewClass + ".zoomoutbutton").attr("disabled", true);
        var jumps = gvd.curJump;
        for (var i = 0; i < jumps.length; i++)
            if (jumps[i].type == "literal_zoom_in")
                d3.select(viewClass + ".zoominbutton")
                    .attr("disabled", null)
                    .on("click", function() {
                        literalZoomIn(viewId);
                    });
            else if (jumps[i].type == "literal_zoom_out")
                d3.select(viewClass + ".zoomoutbutton")
                    .attr("disabled", null)
                    .on("click", function() {
                        literalZoomOut(viewId);
                    });
        if (scaleX > 1 || scaleY > 1)
            d3.select(viewClass + ".zoomoutbutton")
                .attr("disabled", null)
                .on("click", function() {
                    literalZoomOut(viewId);
                });

        // get data
        RefreshDynamicLayers(viewId, viewportX, viewportY).then(function() {
            // check if zoom scale reaches zoomInFactor
            if (
                (zoomInFactorX > 1 && scaleX >= gvd.maxScale) ||
                (zoomInFactorY > 1 && scaleY >= gvd.maxScale)
            )
                completeZoom(
                    viewId,
                    param.literalZoomIn,
                    zoomInFactorX,
                    zoomInFactorY
                );

            // check if zoom scale reaches zoomOutFactor
            if (
                (zoomOutFactorX < 1 && scaleX <= 1 - param.eps) ||
                (zoomOutFactorY < 1 && scaleY <= 1 - param.eps)
            )
                completeZoom(
                    viewId,
                    param.literalZoomOut,
                    zoomOutFactorX,
                    zoomOutFactorY
                );

            // execute onPan & onZoom handlers
            if (!isZooming && gvd.onPanHandlers != null) {
                var subEvts = Object.keys(gvd.onPanHandlers);
                for (var subEvt of subEvts)
                    if (typeof gvd.onPanHandlers[subEvt] == "function")
                        gvd.onPanHandlers[subEvt]();
            }
            if (isZooming && gvd.onZoomHandlers != null) {
                var subEvts = Object.keys(gvd.onZoomHandlers);
                for (var subEvt of subEvts)
                    if (typeof gvd.onZoomHandlers[subEvt] == "function")
                        gvd.onZoomHandlers[subEvt]();
            }
        });
    }
    // called on page load, and on page resize
    function drawZoomButtons(viewId) {
        var viewClass = ".view_" + viewId;
        if (globalVar.views[viewId].curCanvasId == "") return;

        // create buttons if not existed
        if (d3.select(viewClass + ".gobackbutton").empty())
            d3.select(viewClass + ".kyrixbuttondiv")
                .append("button")
                .classed("view_" + viewId + " gobackbutton", true)
                .attr("disabled", "true")
                .classed("btn", true)
                .classed("btn-default", true)
                .html('<span class="glyphicon glyphicon-arrow-left"></span>');
        if (d3.select(viewClass + ".zoominbutton").empty())
            d3.select(viewClass + ".kyrixbuttondiv")
                .append("button")
                .classed("view_" + viewId + " zoominbutton", true)
                .attr("disabled", "true")
                .classed("btn", true)
                .classed("btn-default", true)
                .html('<span class="glyphicon glyphicon-zoom-in"></span>');
        if (d3.select(viewClass + ".zoomoutbutton").empty())
            d3.select(viewClass + ".kyrixbuttondiv")
                .append("button")
                .classed("view_" + viewId + " zoomoutbutton", true)
                .attr("disabled", "true")
                .classed("btn", true)
                .classed("btn-default", true)
                .html('<span class="glyphicon glyphicon-zoom-out"></span>');

        // deciding button size according to vis size
        var bbox = d3
            .select(viewClass + ".kyrixviewdiv")
            .node()
            .getBoundingClientRect();
        var minSize = Math.min(bbox.width, bbox.height);
        var sizeThresholds = [400, 800, 1200];
        var sizeClasses = ["btn-xs", "btn-sm", ""];
        var sizeClass = "btn-lg";
        for (var i = 0; i < sizeThresholds.length; i++)
            if (minSize <= sizeThresholds[i]) {
                sizeClass = sizeClasses[i];
                break;
            }
        d3.selectAll(viewClass + ".kyrixbuttondiv button")
            .classed("btn-xs", false)
            .classed("btn-sm", false)
            .classed("btn-lg", false);
        if (sizeClass != "")
            d3.selectAll(viewClass + ".kyrixbuttondiv button").classed(
                sizeClass,
                true
            );
    }

    // called after a new canvas is completely rendered
    function setBackButtonState(viewId) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        // goback
        if (gvd.history.length > 0)
            d3.select(viewClass + ".gobackbutton")
                .attr("disabled", null)
                .on("click", function() {
                    backspaceJump(viewId);
                });
        else d3.select(viewClass + ".gobackbutton").attr("disabled", true);
    }

    function getHistoryItem(viewId) {
        var ret = {};
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        ret.predicates = gvd.predicates;
        ret.canvasId = gvd.curCanvasId;
        ret.initialScale = d3.zoomTransform(
            d3.select(viewClass + ".maing").node()
        ).k;

        // save current viewport
        var curViewport = [0, 0, gvd.viewportWidth, gvd.viewportHeight];
        if (d3.select(viewClass + ".mainsvg:not(.static)").size())
            curViewport = d3
                .select(viewClass + ".mainsvg:not(.static)")
                .attr("viewBox")
                .split(" ");
        ret.viewportX = +curViewport[0];
        ret.viewportY = +curViewport[1];
        return ret;
    }

    // called in completeZoom() and RegisterJump()
    // before global variables are changed
    function logHistory(viewId, jump) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;
        var jumpType = jump.type;
        var curHistory = {curJump: jump, jumpType: jumpType};

        // save global variables
        curHistory.predicates = gvd.predicates;
        curHistory.highlightPredicates = gvd.highlightPredicates;
        curHistory.canvasId = gvd.curCanvasId;
        curHistory.canvasObj = gvd.curCanvas;
        curHistory.jumps = gvd.curJump;
        curHistory.staticData = gvd.curStaticData;
        curHistory.initialScale = d3.zoomTransform(
            d3.select(viewClass + ".maing").node()
        ).k;

        // save current viewport
        var curViewport = [0, 0, gvd.viewportWidth, gvd.viewportHeight];
        if (d3.select(viewClass + ".mainsvg:not(.static)").size())
            curViewport = d3
                .select(viewClass + ".mainsvg:not(.static)")
                .attr("viewBox")
                .split(" ");
        curHistory.viewportX = +curViewport[0];
        curHistory.viewportY = +curViewport[1];
        curHistory.viewportW = +curViewport[2];
        curHistory.viewportH = +curViewport[3];

        gvd.history.push(curHistory);
    }

    // handler for go back button
    function backspaceJump(viewId) {
        var gvd = globalVar.views[viewId];

        // get and pop last history object
        var curHistory = gvd.history.pop();

        // disable and remove stuff
        var newJump = JSON.parse(JSON.stringify(curHistory.curJump));
        newJump.backspace = true;
        preJump(viewId, newJump);

        // assign back global vars
        gvd.curCanvasId = curHistory.canvasId;
        gvd.curCanvas = curHistory.canvasObj;
        gvd.curJump = curHistory.jumps;
        gvd.curStaticData = curHistory.staticData;
        gvd.predicates = curHistory.predicates;
        gvd.highlightPredicates = curHistory.highlightPredicates;
        gvd.initialViewportX = curHistory.viewportX;
        gvd.initialViewportY = curHistory.viewportY;
        gvd.initialScale = curHistory.initialScale;

        // start animation
        if (
            newJump.type == param.semanticZoom ||
            newJump.type == param.geometricSemanticZoom
        )
            animateBackspaceSemanticZoom(
                viewId,
                newJump,
                curHistory.startView,
                curHistory.endView
            );
        else if (newJump.type == param.slide) {
            // start a exit & fade transition
            var slideDirection =
                "slideDirection" in newJump
                    ? newJump.slideDirection
                    : (curHistory.curJump.slideDirection + 180) % 360;
            animateSlide(
                viewId,
                slideDirection,
                gvd.initialViewportX,
                gvd.initialViewportY,
                gvd.initialScale || 1,
                newJump
            );
        } else if (newJump.type == param.randomJump) {
            newJump.type = param.randomJump + "Back";
            var gotCanvas = getCurCanvas(viewId);
            gotCanvas.then(function() {
                // render static layers
                renderStaticLayers(viewId);
                // post animation
                postJump(viewId, newJump);
            });
        }
    }

    // handler for zoom in button
    function literalZoomIn(viewId) {
        var gvd = globalVar.views[viewId];

        startLiteralZoomTransition(
            viewId,
            [gvd.viewportWidth / 2, gvd.viewportHeight / 2],
            param.literalZoomFactorPerStep,
            param.literalZoomDuration
        );
    }

    // handler for zoom out button
    function literalZoomOut(viewId) {
        var gvd = globalVar.views[viewId];

        startLiteralZoomTransition(
            viewId,
            [gvd.viewportWidth / 2, gvd.viewportHeight / 2],
            -param.literalZoomFactorPerStep,
            param.literalZoomDuration
        );
    }
    // get from backend the current canvas object assuming curCanvasId is already correctly set
    function getCurCanvas(viewId) {
        var gvd = globalVar.views[viewId];

        // get all jumps starting at currrent canvas
        gvd.curJump = getJumpsByCanvasId(gvd.curCanvasId);

        // check if cache has it
        var postData = "id=" + gvd.curCanvasId;
        for (var i = 0; i < gvd.predicates.length; i++)
            postData +=
                "&predicate" + i + "=" + getSqlPredicate(gvd.predicates[i]);
        if (postData in globalVar.cachedCanvases)
            return new Promise(function(resolve) {
                // note that we don't directly get canvas objects from gvd.project
                // because sometimes the canvas w/h is dynamic and not set, in which
                // case we need to fetch from the backend (using gvd.predicates)
                gvd.curCanvas = globalVar.cachedCanvases[postData].canvasObj;
                gvd.curStaticData =
                    globalVar.cachedCanvases[postData].staticData;
                setupLayerLayouts(viewId);
                resolve();
            });

        // otherwise make a non-blocked http request to the server
        return $.ajax({
            type: "GET",
            url: globalVar.serverAddr + "/canvas",
            data: postData,
            success: function(data) {
                gvd.curCanvas = JSON.parse(data).canvas;
                if (gvd.curCanvas.w < gvd.viewportWidth)
                    gvd.curCanvas.w = gvd.viewportWidth;
                if (gvd.curCanvas.h < gvd.viewportHeight)
                    gvd.curCanvas.h = gvd.viewportHeight;
                gvd.curStaticData = JSON.parse(data).staticData;
                setupLayerLayouts(viewId);

                // insert into cache
                if (!(postData in globalVar.cachedCanvases)) {
                    globalVar.cachedCanvases[postData] = {};
                    globalVar.cachedCanvases[postData].canvasObj =
                        gvd.curCanvas;
                    globalVar.cachedCanvases[postData].staticData =
                        gvd.curStaticData;
                }
            }
        });
    }

    // setup <g>s and <svg>s for each layer
    function setupLayerLayouts(viewId) {
        var gvd = globalVar.views[viewId];

        // number of layers
        var numLayers = gvd.curCanvas.layers.length;

        // set box coordinates
        gvd.boxX = [-1e5];
        gvd.boxY = [-1e5];
        gvd.boxH = [-1e5];
        gvd.boxW = [-1e5];

        // set render data
        gvd.renderData = [];
        for (var i = 0; i < numLayers; i++) gvd.renderData.push([]);
        gvd.tileRenderData = {};

        // create layers
        for (var i = numLayers - 1; i >= 0; i--) {
            var curLayer = gvd.curCanvas.layers[i];
            var isStatic = curLayer.isStatic;
            // add new <g>
            d3.select(".view_" + viewId + ".maing")
                .append("g")
                .classed("view_" + viewId + " layerg layer" + i, true)
                .append("svg")
                .classed("view_" + viewId + " mainsvg", true)
                .classed("static", isStatic)
                .classed("dbox", !isStatic && curLayer.fetchingScheme == "dbox")
                .classed(
                    "tiling",
                    !isStatic && curLayer.fetchingScheme == "tiling"
                )
                .attr("width", gvd.viewportWidth)
                .attr("height", gvd.viewportHeight)
                .attr("preserveAspectRatio", "none")
                .attr("x", 0)
                .attr("y", 0)
                .attr(
                    "viewBox",
                    isStatic
                        ? "0 0" +
                              " " +
                              gvd.viewportWidth +
                              " " +
                              gvd.viewportHeight
                        : gvd.initialViewportX +
                              " " +
                              gvd.initialViewportY +
                              " " +
                              gvd.viewportWidth +
                              " " +
                              gvd.viewportHeight
                )
                .classed(
                    "lowestsvg",
                    isStatic || curLayer.fetchingScheme == "dbox"
                );
        }
    }

    // loop over rendering parameters, convert them to function if needed
    function processRenderingParams() {
        for (var key in globalVar.renderingParams) {
            var curValue = globalVar.renderingParams[key];
            if (typeof curValue == "string" && curValue.parseFunction() != null)
                globalVar.renderingParams[key] = curValue.parseFunction();
            // check if it's ssv parameters
            // if so, do a nested round of converting
            if (key.startsWith("ssv_")) {
                for (key in curValue) {
                    var curV = curValue[key];
                    if (typeof curV == "string" && curV.parseFunction() != null)
                        curValue[key] = curV.parseFunction();
                }
            }
        }
    }

    // add the styles to the document
    function processStyles() {
        if (globalVar.project.styles.length <= 0) return;

        for (var i = globalVar.project.styles.length - 1; i >= 0; i--) {
            if (globalVar.project.styles[i].match(/https?:\/\//)) {
                d3.select("head")
                    .append("link")
                    .attr("rel", "stylesheet")
                    .attr("type", "text/css")
                    .attr("href", globalVar.project.styles[i]);
            } else {
                d3.select("head")
                    .append("style")
                    .classed("kyrixstyles", true)
                    .attr("type", "text/css")
                    .html(globalVar.project.styles[i]);
            }
        }
    }

    // resize kyrix vis to fit in vis div bounds
    // also, call drawZoomButton to make buttons smaller/bigger
    function resizeKyrixStuff(viewId) {
        drawZoomButtons(viewId);

        // for vis
        var viewClass = ".view_" + viewId;
        var div = d3.select(viewClass + ".kyrixvisdiv");

        // maximum space allowed in the div
        var bbox = div.node().getBoundingClientRect();
        var maxW = bbox.width;
        var maxH = bbox.height;

        // user-specified width/height
        var viewSvg = d3.select(viewClass + ".viewsvg");
        var viewWidth = viewSvg.attr("width");
        var viewHeight = viewSvg.attr("height");

        // maximum space according to the ratio of view svg
        var realW = Math.min(maxW, (maxH * viewWidth) / viewHeight);
        var realH = (realW * viewHeight) / viewWidth;

        // set viewbox accordingly
        viewSvg.attr(
            "viewBox",
            "0 0 " +
                (viewWidth * viewWidth) / realW +
                " " +
                (viewHeight * viewHeight) / realH
        );

        // center
        viewSvg
            .style("left", bbox.width / 2 - realW / 2 + "px")
            .style("top", bbox.height / 2 - realH / 2 + "px");
    }

    // set up page
    function pageOnLoad(serverAddr, kyrixRawDiv) {
        if (serverAddr != null) {
            // get rid of the last '/'
            if (serverAddr[serverAddr.length - 1] == "/")
                serverAddr = serverAddr.substring(0, serverAddr.length - 1);
            globalVar.serverAddr = serverAddr;
        } else globalVar.serverAddr = "";

        // create a div where kyrix vis lives in
        var kyrixDiv = d3.select(kyrixRawDiv).classed("kyrixdiv", true);

        // get information about the first canvas to render
        // and return a promise representing whether kyrix is loaded
        return $.ajax({
            type: "GET",
            url: globalVar.serverAddr + "/first",
            data: {},
            async: false
        }).then(function(data) {
            var response = JSON.parse(data);
            globalVar.project = response.project;
            globalVar.tileW = +response.tileW;
            globalVar.tileH = +response.tileH;
            // merge BGRP and rendering params
            globalVar.renderingParams = JSON.parse(
                globalVar.project.renderingParams
            );
            var BGRPKeys = Object.keys(globalVar.project.BGRP);
            for (var i = 0; i < BGRPKeys.length; i++) {
                var curBGRPKey = BGRPKeys[i];
                if (!(curBGRPKey in globalVar.renderingParams))
                    globalVar.renderingParams[curBGRPKey] = {};
                var curRPEntry = globalVar.renderingParams[curBGRPKey];
                globalVar.renderingParams[curBGRPKey] = {
                    ...curRPEntry,
                    ...globalVar.project.BGRP[curBGRPKey]
                };
            }
            processRenderingParams();

            // process user-defined CSS styles
            processStyles();

            // remove all jump option popovers when the window is resized
            d3.select(window).on("resize.popover", removePopovers);
            d3.select(window).on("click", removePopovers);

            // create view layouts
            var viewSpecs = globalVar.project.views;
            for (var i = 0; i < viewSpecs.length; i++) {
                // get a reference for current globalvar dict
                var viewId = viewSpecs[i].id;
                globalVar.views[viewId] = {};
                var gvd = globalVar.views[viewId];

                // create a view div, a button div and a vis div
                var viewDiv = kyrixDiv
                    .append("div")
                    .classed("kyrixviewdiv", true)
                    .classed("view_" + viewId, true);
                var buttonDiv = viewDiv
                    .append("div")
                    .classed("kyrixbuttondiv", true)
                    .classed("view_" + viewId, true);
                var visDiv = viewDiv
                    .append("div")
                    .classed("kyrixvisdiv", true)
                    .classed("view_" + viewId, true);

                // make things responsive
                new ResizeSensor(
                    visDiv.node(),
                    (function(viewId) {
                        return function() {
                            resizeKyrixStuff(viewId);
                        };
                    })(viewId)
                );

                // initial setup
                gvd.initialViewportX = viewSpecs[i].initialViewportX;
                gvd.initialViewportY = viewSpecs[i].initialViewportY;
                gvd.viewportWidth = viewSpecs[i].width;
                gvd.viewportHeight = viewSpecs[i].height;
                gvd.curCanvasId = viewSpecs[i].initialCanvasId;
                gvd.renderData = null;
                gvd.tileRenderData = null;
                gvd.pendingBoxRequest = null;
                gvd.curCanvas = null;
                gvd.curJump = null;
                gvd.curStaticData = null;
                gvd.history = [];
                gvd.animation = false;
                gvd.predicates = [];
                gvd.highlightPredicates = [];
                if (gvd.curCanvasId != "") {
                    var predDict = JSON.parse(viewSpecs[i].initialPredicates);
                    var numLayer = getCanvasById(gvd.curCanvasId).layers.length;
                    for (var j = 0; j < numLayer; j++)
                        if ("layer" + j in predDict)
                            gvd.predicates.push(predDict["layer" + j]);
                        else gvd.predicates.push({});
                }

                var visWidth = gvd.viewportWidth + param.viewPadding * 2;
                var visHeight = gvd.viewportHeight + param.viewPadding * 2;
                // Set  max size (don't allow div to get bigger than svg)
                // visDiv
                //     .style("max-width", visWidth + "px")
                //     .style("max-height",visHeight + "px");

                // set up view svg
                visDiv
                    .append("svg")
                    .classed("view_" + viewId + " viewsvg", true)
                    .attr("width", visWidth)
                    .attr("height", visHeight)
                    .attr("x", viewSpecs[i].minx)
                    .attr("y", viewSpecs[i].miny)
                    .append("g")
                    .classed("view_" + viewId + " axesg", true)
                    .attr(
                        "transform",
                        "translate(" +
                            param.viewPadding +
                            "," +
                            param.viewPadding +
                            ")"
                    );

                // set up main group
                d3.select(".view_" + viewId + ".viewsvg")
                    .append("g")
                    .classed("view_" + viewId + " maing", true)
                    .attr(
                        "transform",
                        "translate(" +
                            param.viewPadding +
                            "," +
                            param.viewPadding +
                            ")"
                    )
                    .append("rect") // a transparent rect to receive pointer events
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", gvd.viewportWidth)
                    .attr("height", gvd.viewportHeight)
                    .style("opacity", 0);

                // initialize zoom buttons, must before getCurCanvas is called
                drawZoomButtons(viewId);

                // render this view
                if (gvd.curCanvasId != "") {
                    return getCurCanvas(viewId).then(
                        (function(viewId) {
                            return function() {
                                // render static trims
                                renderStaticLayers(viewId);

                                // set up zoom
                                setupZoom(viewId, 1);

                                // set button state
                                setBackButtonState(viewId);
                            };
                        })(viewId)
                    );
                }
            }
        });
    }
    // render axes
    function renderAxes(viewId, viewportX, viewportY, vWidth, vHeight) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        var axesg = d3.select(viewClass + ".axesg");
        axesg.selectAll("*").remove();

        // run axes function
        var axesFunc = gvd.curCanvas.axes;
        if (axesFunc == "") return;

        var args = getOptionalArgs(viewId);
        if (gvd.curCanvas.axesSSVRPKey != "")
            args.axesSSVRPKey = gvd.curCanvas.axesSSVRPKey;
        var axes = axesFunc.parseFunction()(args);
        for (var i = 0; i < axes.length; i++) {
            // create g element
            var curg = axesg
                .append("g")
                .classed("axis", true)
                .attr("id", "axes" + i)
                .attr(
                    "transform",
                    "translate(" +
                        axes[i].translate[0] +
                        "," +
                        axes[i].translate[1] +
                        ")"
                );

            // construct a scale function according to current viewport
            var newScale = axes[i].scale.copy();
            if (axes[i].dim == "x") {
                // get visible canvas range
                var lo = Math.max(viewportX, axes[i].scale.range()[0]);
                var hi = Math.min(viewportX + vWidth, axes[i].scale.range()[1]);

                // get visible viewport range
                var t = d3
                    .scaleLinear()
                    .domain([viewportX, viewportX + vWidth])
                    .range([0, gvd.viewportWidth]);
                newScale.range([t(lo), t(hi)]);
                newScale.domain([lo, hi].map(axes[i].scale.invert));
            } else {
                // get visible canvas range
                var lo = Math.max(viewportY, axes[i].scale.range()[0]);
                var hi = Math.min(
                    viewportY + vHeight,
                    axes[i].scale.range()[1]
                );

                // get visible viewport range
                var t = d3
                    .scaleLinear()
                    .domain([viewportY, viewportY + vHeight])
                    .range([0, gvd.viewportHeight]);
                newScale.range([t(lo), t(hi)]);
                newScale.domain([lo, hi].map(axes[i].scale.invert));
            }

            // call axis function
            curg.call(axes[i].axis.scale(newScale));

            // styling
            if ("styling" in axes[i])
                axes[i].styling(curg, axes[i].dim, i, args);
        }
    }

    // get an array of tile ids based on the current viewport location
    function getTileArray(viewId, vX, vY, vWidth, vHeight) {
        var gvd = globalVar.views[viewId];

        var tileW = globalVar.tileW;
        var tileH = globalVar.tileH;
        var w = gvd.curCanvas.w;
        var h = gvd.curCanvas.h;

        // calculate the tile range that the viewport spans
        var xStart = Math.max(0, Math.floor(vX / tileW) - param.extraTiles);
        var yStart = Math.max(0, Math.floor(vY / tileH) - param.extraTiles);
        var xEnd = Math.min(
            Math.floor(w / tileW),
            Math.floor((vX + vWidth) / tileW) + param.extraTiles
        );
        var yEnd = Math.min(
            Math.floor(h / tileH),
            Math.floor((vY + vHeight) / tileH) + param.extraTiles
        );

        var tileIds = [];
        for (var i = xStart; i <= xEnd; i++)
            for (var j = yStart; j <= yEnd; j++)
                tileIds.push([i * tileW, j * tileH, gvd.curCanvasId]);

        return tileIds;
    }

    function highlightLowestSvg(viewId, svg, layerId) {
        var gvd = globalVar.views[viewId];
        if (gvd.highlightPredicates.length == 0) return;
        svg.selectAll("g")
            .selectAll("*")
            .each(function(d) {
                if (d == null || gvd.highlightPredicates[layerId] == {}) return;
                if (isHighlighted(d, gvd.highlightPredicates[layerId]))
                    d3.select(this).style("opacity", 1);
                else d3.select(this).style("opacity", param.dimOpacity);
            });
    }

    function renderTiles(viewId, viewportX, viewportY, vpW, vpH, optionalArgs) {
        var gvd = globalVar.views[viewId];
        var numLayers = gvd.curCanvas.layers.length;
        var viewClass = ".view_" + viewId;
        var tileW = globalVar.tileW;
        var tileH = globalVar.tileH;

        // check # of tile layers
        if (d3.selectAll(viewClass + ".mainsvg.tiling").size() == 0)
            return null;

        // get tile ids
        var tileIds = getTileArray(viewId, viewportX, viewportY, vpW, vpH);

        // assign tile ids to tile
        // and use data joins to remove old tiles and get new tiles
        var tileDataJoins = d3
            .select(viewClass + ".mainsvg.tiling")
            .selectAll("svg")
            .data(tileIds, function(d) {
                return d;
            });

        if (tileDataJoins.exit().size()) {
            // update gvd.renderData
            for (var i = 0; i < numLayers; i++)
                if (gvd.curCanvas.layers[i].fetchingScheme == "tiling") {
                    gvd.renderData[i] = [];
                    tileDataJoins.each(function(d) {
                        var tileId = d[0] + " " + d[1] + " " + gvd.curCanvasId;
                        gvd.renderData[i] = gvd.renderData[i].concat(
                            gvd.tileRenderData[tileId][i]
                        );
                    });

                    // deduplicate
                    var mp = {};
                    gvd.renderData[i] = gvd.renderData[i].filter(function(d) {
                        return mp.hasOwnProperty(JSON.stringify(d))
                            ? false
                            : (mp[JSON.stringify(d)] = true);
                    });

                    // remove exit (invisible) tiles
                    d3.select(viewClass + ".layerg.layer" + i)
                        .select(".mainsvg.tiling")
                        .selectAll("svg")
                        .data(tileIds, function(d) {
                            return d;
                        })
                        .exit()
                        .remove();
                }
        }

        // get new tiles
        var tilePromises = [];
        var isJumping =
            Object.keys(gvd.tileRenderData).length === 0 ? true : false;
        tileDataJoins.enter().each(function(d) {
            // append tile svgs
            d3.selectAll(viewClass + ".mainsvg.tiling")
                .append("svg")
                .attr("width", tileW)
                .attr("height", tileH)
                .datum(d)
                .attr("x", d[0])
                .attr("y", d[1])
                .attr("viewBox", d[0] + " " + d[1] + " " + tileW + " " + tileH)
                .style("opacity", 0)
                .classed("a" + d[0] + d[1] + gvd.curCanvasId, true)
                .classed("view_" + viewId, true)
                .classed("lowestsvg", true);

            // initialize gvd.tileRenderData
            // (used to calculate gvd.renderData)
            var tileId = d[0] + " " + d[1] + " " + gvd.curCanvasId;
            gvd.tileRenderData[tileId] = [];
            for (var i = 0; i < numLayers; i++)
                gvd.tileRenderData[tileId].push([]);

            // send request to backend to get data
            var postData =
                "id=" + gvd.curCanvasId + "&" + "x=" + d[0] + "&" + "y=" + d[1];
            for (var i = 0; i < gvd.predicates.length; i++)
                postData +=
                    "&predicate" + i + "=" + getSqlPredicate(gvd.predicates[i]);
            postData += "&isJumping=" + isJumping;
            var curTilePromise = $.ajax({
                type: "GET",
                url: globalVar.serverAddr + "/tile",
                data: postData,
                success: function(data, status) {
                    // response data
                    var response = JSON.parse(data);
                    var x = response.minx;
                    var y = response.miny;
                    var canvasId = response.canvasId;
                    if (canvasId != gvd.curCanvasId) return;
                    var renderData = response.renderData;
                    var numLayers = gvd.curCanvas.layers.length;

                    // loop through layers
                    for (var i = numLayers - 1; i >= 0; i--) {
                        // current layer object
                        var curLayer = gvd.curCanvas.layers[i];

                        // if this layer is static, continue;
                        if (curLayer.isStatic) continue;

                        // if this layer does not use tiling, continue;
                        if (curLayer.fetchingScheme != "tiling") continue;

                        // remove tuples outside the viewport
                        // doing this because some backend indexers use compression
                        // and may return tuples outside viewport
                        // doing this in the backend is not efficient, so we do it here
                        renderData[i] = renderData[i].filter(function(d) {
                            if (
                                +d.maxx < x ||
                                +d.minx > x + gvd.tileW ||
                                +d.maxy < y ||
                                +d.miny > y + gvd.tileH
                            )
                                return false;
                            return true;
                        });

                        // now add into gvd.renderData, dedup at the same time
                        if (!gvd.renderData[i]) gvd.renderData[i] = [];
                        var mp = {};
                        gvd.renderData[i].forEach(function(d) {
                            mp[JSON.stringify(d)] = true;
                        });
                        for (var j = 0; j < renderData[i].length; j++)
                            if (
                                !mp.hasOwnProperty(
                                    JSON.stringify(renderData[i][j])
                                )
                            )
                                gvd.renderData[i].push(renderData[i][j]);

                        // save the render data of this tile for
                        // calculation of gvd.renderData later on
                        // when some tiles are removed
                        gvd.tileRenderData[x + " " + y + " " + gvd.curCanvasId][
                            i
                        ] = renderData[i];

                        // current tile svg
                        var tileSvg = d3
                            .select(viewClass + ".layerg.layer" + i)
                            .select(".mainsvg")
                            .select(".a" + x + y + gvd.curCanvasId);

                        // it's possible when the tile data is delayed
                        // and this tile is already removed
                        if (tileSvg.empty()) break;

                        // draw current layer
                        var optionalArgsMore = Object.assign({}, optionalArgs);
                        optionalArgsMore["tileX"] = x;
                        optionalArgsMore["tileY"] = y;
                        optionalArgsMore["layerId"] = i;
                        optionalArgsMore["ssvId"] = curLayer.ssvId;
                        optionalArgsMore["usmapId"] = curLayer.usmapId;
                        optionalArgsMore["staticAggregationId"] =
                            curLayer.staticAggregationId;
                        curLayer.rendering.parseFunction()(
                            tileSvg,
                            renderData[i],
                            optionalArgsMore
                        );
                        tileSvg.style("opacity", 1.0);

                        // tooltip
                        if (curLayer.tooltipColumns.length > 0)
                            makeTooltips(
                                tileSvg.selectAll("*"),
                                curLayer.tooltipColumns,
                                curLayer.tooltipAliases
                            );

                        // register jumps
                        if (!gvd.animation) registerJumps(viewId, tileSvg, i);

                        // highlight
                        highlightLowestSvg(viewId, tileSvg, i);

                        // rescale
                        tileSvg
                            .select("g:last-of-type")
                            .selectAll(".kyrix-retainsizezoom")
                            .each(function() {
                                zoomRescale(viewId, this);
                            });
                    }
                }
            });
            tilePromises.push(curTilePromise);
        });

        if (tilePromises.length == 0) return null;
        return Promise.all(tilePromises);
    }

    function renderDynamicBoxes(
        viewId,
        viewportX,
        viewportY,
        vpW,
        vpH,
        optionalArgs
    ) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        // check if there is dbox layers
        if (d3.selectAll(viewClass + ".mainsvg.dbox").size() == 0) return null;

        // check if there is pending box requests
        if (gvd.pendingBoxRequest == gvd.curCanvasId) return null;

        // check if the user has moved outside the current box
        var cBoxX = gvd.boxX[gvd.boxX.length - 1],
            cBoxY = gvd.boxY[gvd.boxY.length - 1];
        var cBoxW = gvd.boxW[gvd.boxW.length - 1],
            cBoxH = gvd.boxH[gvd.boxH.length - 1];
        if (
            cBoxX < -1e4 ||
            (viewportX <= cBoxX + vpW / 3 && cBoxX >= 0) ||
            (viewportX + vpW >= cBoxX + cBoxW - vpW / 3 &&
                cBoxX + cBoxW <= gvd.curCanvas.w) ||
            (viewportY <= cBoxY + vpH / 3 && cBoxY >= 0) ||
            (viewportY + vpH >= cBoxY + cBoxH - vpH / 3 &&
                cBoxY + cBoxH <= gvd.curCanvas.h)
        ) {
            // new box request
            var postData =
                "id=" +
                gvd.curCanvasId +
                "&" +
                "viewId=" +
                viewId +
                "&" +
                "x=" +
                (viewportX | 0) +
                "&" +
                "y=" +
                (viewportY | 0);
            for (var i = 0; i < gvd.predicates.length; i++)
                postData +=
                    "&predicate" + i + "=" + getSqlPredicate(gvd.predicates[i]);
            postData +=
                "&oboxx=" +
                cBoxX +
                "&oboxy=" +
                cBoxY +
                "&oboxw=" +
                cBoxW +
                "&oboxh=" +
                cBoxH;
            postData += "&isJumping=" + (cBoxX < -1e4 ? true : false);
            if (gvd.curCanvas.wSql.length > 0)
                postData += "&canvasw=" + gvd.curCanvas.w;
            if (gvd.curCanvas.hSql.length > 0)
                postData += "&canvash=" + gvd.curCanvas.h;
            gvd.pendingBoxRequest = gvd.curCanvasId;
            return $.ajax({
                type: "GET",
                url: globalVar.serverAddr + "/dbox",
                data: postData,
                success: function(data) {
                    // response data
                    var response = JSON.parse(data);
                    var x = response.minx;
                    var y = response.miny;
                    var canvasId = response.canvasId;
                    var renderData = response.renderData;

                    // check if this response is already outdated
                    // TODO: only checking canvasID might not be sufficient
                    if (canvasId != gvd.pendingBoxRequest) return;

                    // loop over every layer to render
                    var numLayers = gvd.curCanvas.layers.length;
                    for (var i = numLayers - 1; i >= 0; i--) {
                        // current layer object
                        var curLayer = gvd.curCanvas.layers[i];

                        // if this layer is static, continue
                        if (curLayer.isStatic) continue;

                        // if this layer does not use dbox, continue
                        if (curLayer.fetchingScheme != "dbox") continue;

                        // current box svg
                        var dboxSvg = d3
                            .select(viewClass + ".layerg.layer" + i)
                            .select(".mainsvg");

                        // remove stale geometries
                        dboxSvg
                            .selectAll("g")
                            .selectAll("*")
                            .filter(function(d) {
                                if (!curLayer.deltaBox) return true;
                                if (d == null) return false; // requiring all non-def stuff to be bound to data
                                if (
                                    +d.maxx < x ||
                                    +d.minx > x + response.boxW ||
                                    +d.maxy < y ||
                                    +d.miny > y + response.boxH
                                )
                                    return true;
                                else return false;
                            })
                            .remove();

                        // remove empty <g>s.
                        dboxSvg
                            .selectAll("g")
                            .filter(function() {
                                return d3
                                    .select(this)
                                    .select("*")
                                    .empty();
                            })
                            .remove();

                        // remove those returned objects outside the viewport
                        // doing this because some backend indexers use compression
                        // and may return tuples outside viewport
                        // doing this in the backend is not efficient, so we do it here
                        // also dedup
                        var mp = {};
                        gvd.renderData[i].forEach(function(d) {
                            mp[JSON.stringify(d)] = true;
                        });
                        renderData[i] = renderData[i].filter(function(d) {
                            if (
                                +d.maxx < x ||
                                +d.minx > x + response.boxW ||
                                +d.maxy < y ||
                                +d.miny > y + response.boxH
                            )
                                return false;
                            if (
                                curLayer.deltaBox &&
                                mp.hasOwnProperty(JSON.stringify(d))
                            )
                                return false;
                            return true;
                        });

                        // construct new globalVar.renderData
                        var newLayerData = JSON.parse(
                            JSON.stringify(renderData[i])
                        );
                        if (curLayer.deltaBox) {
                            // add data from intersection w/ old box data
                            for (var j = 0; j < gvd.renderData[i].length; j++) {
                                var d = gvd.renderData[i][j];
                                if (
                                    !(
                                        +d.maxx < x ||
                                        +d.minx > x + response.boxW ||
                                        +d.maxy < y ||
                                        +d.miny > y + response.boxH
                                    )
                                )
                                    newLayerData.push(d);
                            }
                        }
                        gvd.renderData[i] = newLayerData;

                        // draw current layer
                        var optionalArgsMore = Object.assign({}, optionalArgs);
                        optionalArgsMore["boxX"] = x;
                        optionalArgsMore["boxY"] = y;
                        optionalArgsMore["boxW"] = response.boxW;
                        optionalArgsMore["boxH"] = response.boxH;
                        optionalArgsMore["layerId"] = i;
                        optionalArgsMore["ssvId"] = curLayer.ssvId;
                        optionalArgsMore["usmapId"] = curLayer.usmapId;
                        optionalArgsMore["staticAggregationId"] =
                            curLayer.staticAggregationId;
                        curLayer.rendering.parseFunction()(
                            dboxSvg,
                            renderData[i],
                            optionalArgsMore
                        );

                        // tooltip
                        if (curLayer.tooltipColumns.length > 0)
                            makeTooltips(
                                dboxSvg.select("g:last-of-type").selectAll("*"),
                                curLayer.tooltipColumns,
                                curLayer.tooltipAliases
                            );

                        // register jumps
                        if (!gvd.animation) registerJumps(viewId, dboxSvg, i);

                        // highlight
                        highlightLowestSvg(viewId, dboxSvg, i);

                        // rescale
                        dboxSvg
                            .select("g:last-of-type")
                            .selectAll(".kyrix-retainsizezoom")
                            .each(function() {
                                zoomRescale(viewId, this);
                            });
                    }

                    // modify global var
                    gvd.boxH.push(response.boxH);
                    gvd.boxW.push(response.boxW);
                    gvd.boxX.push(x);
                    gvd.boxY.push(y);
                    gvd.pendingBoxRequest = null;

                    // refresh dynamic layers again while panning (#37)
                    if (!gvd.animation) {
                        var curViewport = d3
                            .select(viewClass + ".mainsvg:not(.static)")
                            .attr("viewBox")
                            .split(" ");
                        RefreshDynamicLayers(
                            viewId,
                            curViewport[0],
                            curViewport[1]
                        );
                    }
                }
            });
        }

        return null;
    }

    function RefreshDynamicLayers(viewId, viewportX, viewportY) {
        var gvd = globalVar.views[viewId];
        var viewClass = ".view_" + viewId;

        // current viewport
        viewportX = +viewportX;
        viewportY = +viewportY;
        var vpW, vpH;
        if (d3.select(viewClass + ".mainsvg:not(.static)").size() == 0)
            (vpW = gvd.viewportWidth), (vpH = gvd.viewportHeight);
        else {
            var curViewport = d3
                .select(viewClass + ".mainsvg:not(.static)")
                .attr("viewBox")
                .split(" ");
            vpW = +curViewport[2];
            vpH = +curViewport[3];
        }

        // render axes
        renderAxes(viewId, viewportX, viewportY, vpW, vpH);

        // no dynamic layers? return
        if (d3.select(viewClass + ".mainsvg:not(.static)").size() == 0)
            return Promise.resolve();

        // optional rendering args
        var optionalArgs = getOptionalArgs(viewId);
        optionalArgs["viewportX"] = viewportX;
        optionalArgs["viewportY"] = viewportY;

        // fetch data
        var tilePromise = renderTiles(
            viewId,
            viewportX,
            viewportY,
            vpW,
            vpH,
            optionalArgs
        );
        var dboxPromise = renderDynamicBoxes(
            viewId,
            viewportX,
            viewportY,
            vpW,
            vpH,
            optionalArgs
        );
        if (tilePromise != null || dboxPromise != null)
            return Promise.all([tilePromise, dboxPromise]).then(function() {
                if (
                    gvd.animation != param.semanticZoom &&
                    gvd.animation != param.slide
                )
                    d3.selectAll(viewClass + ".oldlayerg")
                        .transition()
                        .duration(param.literalZoomFadeOutDuration)
                        .style("opacity", 0)
                        .remove();
            });
        else return Promise.resolve();
    }

    exports.addRenderingParameters = addRenderingParameters;
    exports.displayOnlyFilteredNodes = displayOnlyFilteredNodes;
    exports.filteredNodes = filteredNodes;
    exports.getCurrentCanvasId = getCurrentCanvasId;
    exports.getCurrentViewport = getCurrentViewport;
    exports.getGlobalVarDictionary = getGlobalVarDictionary;
    exports.getMainSvg = getMainSvg;
    exports.getObjectData = getObjectData;
    exports.getObjectDataOfLayer = getObjectDataOfLayer;
    exports.getRenderData = getRenderData;
    exports.getRenderDataOfLayer = getRenderDataOfLayer;
    exports.getRenderingParameters = getRenderingParameters;
    exports.getViewSvg = getViewSvg;
    exports.initializeApp = initializeApp;
    exports.on = on;
    exports.reRender = reRender;
    exports.setFilteredNodesOpacity = setFilteredNodesOpacity;
    exports.triggerJump = triggerJump;
    exports.triggerPan = triggerPan;
    exports.triggerPredicate = triggerPredicate;
    exports.randomJump = randomJump;
    exports.getHistoryItem = getHistoryItem;

    Object.defineProperty(exports, "__esModule", {value: true});
});
