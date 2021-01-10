const getBodyStringOfFunction = require("./helper").getBodyStringOfFunction;
const writeJS = require("./helper").writeJS;

const headerStuff = function() {
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

const addSSVCanvas = function() {
    // ================================================================
    spec = REPLACE_ME_JSON;
    let REPLACE_ME_PYRAMID = p.addSSV(new SSV(spec), {view: view}).pyramid;
};

const addStaticAggregationCanvas = function() {
    // ================================================================
    spec = REPLACE_ME_JSON;
    let REPLACE_ME_CANVAS = p.addStaticAggregation(
        new StaticAggregation(spec),
        {view: view}
    ).canvas;
};

const footerStuff = function() {
    p.setInitialStates(view, REPLACE_ME_CANVAS, 0, 0);

    // save to db
    p.saveProject();
};

function genSpec(canvases, appName) {
    // header
    let s = getBodyStringOfFunction(headerStuff).replace(
        /REPLACE_ME_APP_NAME/g,
        appName
    );

    // add canvases
    for (let c of canvases) {
        if (c.visDataMappings.type === "scatterplot") {
            if (!c.id.includes("level0")) continue;
            let pyramidObj = c.id.substring(0, c.id.indexOf("_")) + "Pyramid";
            s += getBodyStringOfFunction(addSSVCanvas)
                .replace(/REPLACE_ME_JSON/g, JSON.stringify(c.spec))
                .replace(/REPLACE_ME_PYRAMID/g, pyramidObj);
            c.pyramidObj = pyramidObj;
        } else {
            let canvasObj = c.id + "Canvas";
            s += getBodyStringOfFunction(addStaticAggregationCanvas)
                .replace(/REPLACE_ME_JSON/g, JSON.stringify(c.spec))
                .replace(/REPLACE_ME_CANVAS/g, canvasObj);
            c.canvasObj = canvasObj;
        }
    }

    // footer
    s += getBodyStringOfFunction(footerStuff).replace(
        /REPLACE_ME_CANVAS/g,
        canvases[0].pyramidObj
            ? canvases[0].pyramidObj + "[0]"
            : canvases[0].canvasObj
    );

    // write to file
    writeJS(s, `apps/${appName}/output/${appName}.js`);
}

module.exports = {
    genSpec
};
