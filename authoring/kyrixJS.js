const getBodyStringOfFunction = require("./helper").getBodyStringOfFunction;
const writeJS = require("./helper").writeJS;

const headerStuff = () => {
    // libraries
    const Project = require("../../src/index").Project;
    const Jump = require("../../src/Jump").Jump;
    const View = require("../../src/View").View;
    const SSV = require("../../src/template-api/SSV").SSV;
    const StaticAggregation = require("../../src/template-api/StaticAggregation")
        .StaticAggregation;

    // construct a project
    let p = new Project("REPLACE_ME_APP_NAME", "../../../config.txt");

    // construct a view
    let view = new View("REPLACE_ME_APP_NAME", 1000, 1000);
    p.addView(view);

    /******************************** canvases ********************************/
    let spec;
};

const addSSVCanvas = () => {
    // ================================================================
    spec = REPLACE_ME_JSON;
    let REPLACE_ME_PYRAMID = p.addSSV(new SSV(spec), {view: view}).pyramid;
};

const addStaticAggregationCanvas = () => {
    // ================================================================
    spec = REPLACE_ME_JSON;
    let REPLACE_ME_CANVAS = p.addStaticAggregation(
        new StaticAggregation(spec),
        {view: view}
    ).canvas;
};

const jumpCommonVariables = () => {
    /******************************** jumps ********************************/
    let ssvJumpSelector = function(row, args) {
        return args.layerId == 0;
    };

    let saJumpSelector = function(row) {
        return row != null && typeof row == "object" && "kyrixAggValue" in row;
    };

    let newViewport = function() {
        return {constant: [0, 0]};
    };
};

const addJump = () => {
    // ========================== REPLACE_ME_FROM_CANVAS --> REPLACE_ME_TO_CANVAS ==========================
    var newPredicate = function(row, args) {
        var pred = REPLACE_ME_PRED_JSON;
        if (
            REPLACE_ME_SEMANTIC_ZOOM &&
            args.predicates.layer0 &&
            Object.keys(args.predicates.layer0).length > 0
        )
            pred = {AND: [args.predicates.layer0, pred]};
        return REPLACE_ME_PRED_LAYERS;
    };

    var jumpName = function() {
        return "Table REPLACE_ME_JUMPNAME_TABLE [REPLACE_ME_JUMPNAME_VISTITLE]";
    };

    p.addJump(
        new Jump(
            REPLACE_ME_FROM_CANVAS_OBJ,
            REPLACE_ME_TO_CANVAS_OBJ,
            "REPLACE_ME_JUMP_TYPE",
            {
                selector: REPLACE_ME_SELECTOR,
                viewport: newViewport,
                predicates: newPredicate,
                name: jumpName,
                noPrefix: true,
                slideSuperman: true
            }
        )
    );
};

const footerStuff = function() {
    p.setInitialStates(view, REPLACE_ME_CANVAS, 0, 0);

    // save to db
    p.saveProject();
};

function genSpec(canvases, appName) {
    const misc = require(`./apps/${appName}/input/misc.json`);
    const pk = misc.pk;
    const graph = misc.graph;

    // header
    let s = getBodyStringOfFunction(headerStuff).replace(
        /REPLACE_ME_APP_NAME/g,
        appName
    );

    // add canvases
    for (let c of canvases) {
        if (c.visDataMappings.type === "scatterplot") {
            let pyramidObj = c.id.substring(0, c.id.indexOf("_")) + "Pyramid";
            if (c.id.includes("level0"))
                s += getBodyStringOfFunction(addSSVCanvas)
                    .replace(/REPLACE_ME_JSON/g, JSON.stringify(c.spec))
                    .replace(/REPLACE_ME_PYRAMID/g, pyramidObj);
            c.canvasObj =
                pyramidObj +
                "[" +
                c.id.substring(c.id.indexOf("level") + 5) +
                "]";
        } else {
            let canvasObj = c.id + "Canvas";
            s += getBodyStringOfFunction(addStaticAggregationCanvas)
                .replace(/REPLACE_ME_JSON/g, JSON.stringify(c.spec))
                .replace(/REPLACE_ME_CANVAS/g, canvasObj);
            c.canvasObj = canvasObj;
        }
    }

    // add jumps
    let predLayer0 = "{layer0: pred}";
    let predLayers0And1 = "{layer0: pred, layer1: pred}";
    const visTypeMapping = {
        scatterplot: "Scatterplot",
        treemap: "Tree Map",
        barchart: "Bar Chart",
        circlepack: "Circle Pack",
        piechart: "Pie Chart",
        wordcloud: "Word Cloud"
    };

    s += getBodyStringOfFunction(jumpCommonVariables);
    for (let i = 0; i < canvases.length; i++) {
        for (let j = 0; j < canvases.length; j++) {
            if (i === j) continue;
            // check if it's two levels from the same ssv
            if (
                canvases[i].id.startsWith("ssv") &&
                canvases[j].id.startsWith("ssv") &&
                canvases[i].id.substring(0, canvases[i].id.indexOf("_")) ===
                    canvases[j].id.substring(0, canvases[j].id.indexOf("_"))
            )
                continue;

            // if j is an ssv canvas, it should be the first level
            if (
                canvases[j].id.startsWith("ssv") &&
                !canvases[j].id.includes("level0")
            )
                continue;

            // get an array of array of filter keys from table i
            // the reason that this is an array is because
            // one table can have multiple primary key combinations
            let fromFilterArray;
            if (canvases[i].visDataMappings.type === "scatterplot")
                fromFilterArray = pk[canvases[i].table];
            else {
                let dimensions;
                if (
                    canvases[i].visDataMappings.type === "barchart" &&
                    canvases[i].spec.query.stackDimensions &&
                    canvases[i].spec.query.stackDimensions.length > 0
                )
                    dimensions = canvases[i].spec.query.stackDimensions;
                else dimensions = canvases[i].spec.query.dimensions;

                fromFilterArray = [dimensions];
                for (let comb of pk[canvases[i].table]) {
                    let contains = true;
                    for (let col of comb)
                        if (!dimensions.includes(col)) {
                            contains = false;
                            break;
                        }
                    if (contains) fromFilterArray.push(comb);
                }
            }

            let filters;
            let jump = false;
            let ti = canvases[i].table,
                tj = canvases[j].table;
            for (let fromFilters of fromFilterArray) {
                // for each filter column of i
                // identify a match on the other side
                filters = {};
                let matchCols = [];
                for (let col of fromFilters) {
                    filters[col] = null;
                    if (ti === tj) filters[col] = col;
                    else {
                        // find one column in the other table that matches col
                        for (let edge of graph) {
                            if (
                                (edge.source === ti && edge.target == tj) ||
                                (edge.target === ti && edge.source == tj)
                            )
                                for (let match of edge.matches) {
                                    if (
                                        edge.source === ti &&
                                        match.sourceCol === col &&
                                        canvases[j].filterableColumns.includes(
                                            match.targetCol
                                        ) &&
                                        !matchCols.includes(match.targetCol)
                                    ) {
                                        filters[col] = match.targetCol;
                                        break;
                                    }
                                    if (
                                        edge.target === ti &&
                                        match.targetCol === col &&
                                        canvases[j].filterableColumns.includes(
                                            match.sourceCol
                                        ) &&
                                        !matchCols.includes(match.sourceCol)
                                    ) {
                                        filters[col] = match.sourceCol;
                                        break;
                                    }
                                }
                            if (filters[col] !== null) break;
                        }
                        if (filters[col] == null) break;
                        matchCols.push(filters[col]);
                    }
                }

                // if any of the filter columns of i doesn't have a match
                // then there isn't a jump for this fromFilter
                if (fromFilters.filter(d => filters[d] === null).length === 0)
                    jump = true;
                if (jump) break;
            }
            if (!jump) continue;

            // construct pred json
            let predJson = "";
            // loop through all filter columns
            for (let col in filters) {
                let filter = `{"==": ["${filters[col]}", row.${col}]}`;
                if (predJson.length === 0) predJson = filter;
                else predJson = `{AND: [${predJson}, ${filter}]}`;
            }

            // code for adding the jump
            let fromVisType = canvases[i].visDataMappings.type;
            let toVisType = canvases[j].visDataMappings.type;
            s += getBodyStringOfFunction(addJump)
                .replace(/REPLACE_ME_FROM_CANVAS_OBJ/g, canvases[i].canvasObj)
                .replace(/REPLACE_ME_TO_CANVAS_OBJ/g, canvases[j].canvasObj)
                .replace(/REPLACE_ME_FROM_CANVAS/g, canvases[i].id)
                .replace(/REPLACE_ME_TO_CANVAS/g, canvases[j].id)
                .replace(/REPLACE_ME_PRED_JSON/g, predJson)
                .replace(/REPLACE_ME_SEMANTIC_ZOOM/g, ti === tj ? true : false)
                .replace(
                    /REPLACE_ME_PRED_LAYERS/g,
                    toVisType === "scatterplot" ? predLayer0 : predLayers0And1
                )
                .replace(/REPLACE_ME_JUMPNAME_TABLE/g, tj)
                .replace(/REPLACE_ME_JUMPNAME_VISTITLE/g, canvases[j].title)
                .replace(
                    /REPLACE_ME_JUMP_TYPE/g,
                    ti === tj ? "semantic_zoom" : "slide"
                )
                .replace(
                    /REPLACE_ME_SELECTOR/g,
                    fromVisType === "scatterplot"
                        ? "ssvJumpSelector"
                        : "saJumpSelector"
                );
        }
    }

    // footer
    s += getBodyStringOfFunction(footerStuff).replace(
        /REPLACE_ME_CANVAS/g,
        canvases[0].canvasObj
    );

    // write to file
    writeJS(s, `apps/${appName}/output/${appName}.js`);
}

module.exports = {
    genSpec
};
