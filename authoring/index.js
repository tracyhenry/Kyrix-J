const appName = process.env.KYRIXJ_PROJECT;
const vis = require(`./apps/${appName}/input/vis.json`);
const misc = require(`./apps/${appName}/input/misc.json`);
const pk = misc.pk;
const graph = misc.graph;

const helper = require("./helper");
const genKyrixJS = require("./kyrixJS").genSpec;
const psql = require("pg");

// global variables
let allColumns,
    keyColumns,
    canvases,
    tables = Object.keys(pk);

async function generateMetadata() {
    // generate metadata
    let metadata = {};

    // view Id
    metadata.kyrixViewId = appName;

    // SQL query, canvasIdToTable, visualDataMappings
    metadata.sqlQuery = {};
    metadata.canvasIdToTable = {};
    metadata.visualDataMappings = {};
    canvases.forEach(c => {
        metadata.sqlQuery[c.id] = c.query;
        metadata.canvasIdToTable[c.id] = c.table;
        metadata.visualDataMappings[c.id] = c.visDataMappings;
    });

    // graph edges
    metadata.graphEdges = graph;

    // table metadata
    metadata.tableMetadata = {};
    let tm = metadata.tableMetadata;
    for (let t of tables) {
        tm[t] = {};
        // get number of rows
        let sql = `SELECT COUNT(*) FROM ${t}`;
        let res = await client.query(sql);
        tm[t].numRecords = res.rows[0].count;

        // get number of canvases
        tm[t].numCanvas = canvases.filter(
            c =>
                c.table === t &&
                (!c.id.startsWith("ssv") || c.id.includes("level0"))
        ).length;
    }

    // tableColumns
    metadata.tableColumns = allColumns;

    // primary keys
    metadata.primaryKeys = pk;

    // click jump defaults
    metadata.clickJumpDefaults = {};
    let cjd = metadata.clickJumpDefaults;
    tables.forEach(t => {
        cjd[t] = [];
    });
    canvases.forEach(c => {
        if (c.id.startsWith("ssv") && !c.id.includes("level0")) return;
        cjd[c.table].push({
            title: c.title,
            canvasId: c.id,
            predDict: c.predDict,
            newVpX: 0,
            newVpY: 0
        });
    });

    // write to output file
    helper.writeJSON(metadata, `apps/${appName}/output/${appName}.json`);
}

async function getAllColumns() {
    allColumns = {};
    for (let t of tables) {
        let res = await client.query(`SELECT * FROM ${t} LIMIT 1;`);
        allColumns[t] = res.fields
            .filter(
                d =>
                    d.name !== "search_tsvector" &&
                    !d.name.includes("kyrix_geo")
            )
            .map(d => d.name);
    }
}

function getKeyColumns() {
    keyColumns = {};
    for (let t of tables) {
        keyColumns[t] = [];
        graph.forEach(d => {
            d.matches.forEach(p => {
                if (d.source === t && !keyColumns[t].includes(p.sourceCol))
                    keyColumns[t].push(p.sourceCol);
                if (d.target === t && !keyColumns[t].includes(p.targetCol))
                    keyColumns[t].push(p.targetCol);
            });
        });
    }
}

function constructCanvases() {
    // each element in canvases is an object with fields like
    // vis data mapping, canvasId, query, table, predDict, spec
    // that are useful in generating the metadata file
    canvases = [];
    let ssvCounter = 0,
        saCounter = 0;
    for (let spec of vis) {
        let cc = [];

        // decide if it's ssv or sa
        if ("layout" in spec) {
            let ssvId = ssvCounter++;

            // num levels
            let numLevels = 10;
            if ("config" in spec && "numLevels" in spec.config)
                numLevels = spec.config.numLevels;

            // visual data mappings
            let vdm = {
                type: "scatterplot",
                x: spec.layout.x.field,
                y: spec.layout.y.field
            };
            if (spec.marks.cluster.config.dotSizeColumn)
                vdm.dot_size = spec.marks.cluster.config.dotSizeColumn;
            if (spec.marks.cluster.config.dotColorColumn)
                vdm.dot_color = spec.marks.cluster.config.dotColorColumn;

            // query
            let query = helper.formatSQL(spec.data.query);

            // table
            let s = query.substring(query.indexOf("FROM") + 4);
            let p = 0;
            for (; ; p++) if (s[p] !== " ") break;
            let table = "";
            for (; p < s.length; p++)
                if (s[p] === " " || s[p] === ";") break;
                else table += s[p];
            table = table.toLowerCase();

            // filterable columns
            let fCols = query
                .substring(query.indexOf("SELECT") + 6, query.indexOf("FROM"))
                .replace(/\s/g, "")
                .split(",");

            // title
            let visTitle = spec.visTitle;
            delete spec.visTitle;

            // one canvas per level
            for (let j = 0; j < numLevels; j++)
                cc.push({
                    query: query,
                    table: table,
                    visDataMappings: vdm,
                    id: `ssv${ssvId}_level${j}`,
                    filterableColumns: fCols,
                    title: visTitle
                });
        } else {
            let c = {};

            // canvas Id
            c.id = "staticAggregation" + saCounter++;

            // table
            c.table = spec.query.table.toLowerCase();

            // query
            let measure = spec.query.measure;
            if (measure.includes("random"))
                c.query =
                    "SELECT " +
                    pk[c.table][0].join(", ") +
                    " FROM " +
                    c.table +
                    ";";
            else {
                c.query = "SELECT ";
                let dimensions = spec.query.dimensions;
                if (spec.query.stackDimensions)
                    dimensions = dimensions.concat(spec.query.stackDimensions);

                let isDimPk = false;
                let pks = pk[c.table];
                for (let pKey of pks) {
                    if (pKey.length !== dimensions.length) continue;
                    isDimPk = true;
                    for (let col of pKey)
                        if (!dimensions.includes(col)) {
                            isDimPk = false;
                            break;
                        }
                    if (isDimPk) break;
                }

                if (!isDimPk)
                    c.query +=
                        dimensions.join(", ") +
                        ", " +
                        measure +
                        " FROM " +
                        c.table +
                        " GROUP BY " +
                        dimensions.join(", ") +
                        ";";
                else {
                    let pos = measure.indexOf("(");
                    let measureCol = measure.substring(
                        pos + 1,
                        measure.length - 1
                    );
                    c.query +=
                        dimensions.join(", ") +
                        ", " +
                        measureCol +
                        " FROM " +
                        c.table +
                        ";";
                    measure = measureCol;
                }
            }
            c.query = helper.formatSQL(c.query);

            // vis data mapping
            switch (spec.type) {
                case "treemap":
                    c.visDataMappings = {
                        type: "treemap",
                        rect_size: measure,
                        rect_color: measure
                    };
                    break;
                case "circlePack":
                    c.visDataMappings = {
                        type: "circlepack",
                        circle_radius: measure,
                        circle_color: measure
                    };
                    break;
                case "pie":
                    c.visDataMappings = {
                        type: "piechart",
                        pie_color: spec.query.dimensions.join(", "),
                        pie_angle: measure
                    };
                    break;
                case "bar":
                    c.visDataMappings = {
                        type: "barchart",
                        x: spec.query.dimensions.join(", "),
                        y: measure
                    };
                    if (spec.query.stackDimensions)
                        c.visDataMappings.bar_color = spec.query.stackDimensions.join(
                            ", "
                        );
                    break;
                case "wordCloud":
                    c.visDataMappings = {
                        type: "wordcloud",
                        word_column: spec.textFields[0],
                        word_size: measure.includes("random")
                            ? "random"
                            : measure
                    };
                    break;
            }

            // populate sampleFields with key columns if any of them don't exist
            let sf = spec.query.sampleFields;
            let allPks = getAllPks(c.table);
            keyColumns[c.table]
                .concat(allPks)
                .filter(
                    d =>
                        !spec.query.dimensions.includes(d) &&
                        (spec.query.stackDimensions == null ||
                            !spec.query.stackDimensions.includes(d))
                )
                .forEach(d => {
                    if (!sf.includes(d)) sf.push(d);
                });
            sf.sort((a, b) => {
                let va = allPks.includes(a)
                    ? 0
                    : keyColumns[c.table].includes(a)
                    ? 1
                    : 2;
                let vb = allPks.includes(b)
                    ? 0
                    : keyColumns[c.table].includes(b)
                    ? 1
                    : 2;
                return va - vb;
            });

            // filterable columns
            let fCols = spec.query.dimensions.concat(sf);
            if (spec.query.stackDimensions)
                fCols = fCols.concat(spec.query.stackDimensions);
            c.filterableColumns = fCols;

            // title
            c.title = spec.legend.title;
            if (c.title.includes("random text size"))
                c.title = c.title.substring(
                    0,
                    c.title.indexOf("random text size") - 2
                );

            cc.push(c);
        }

        // default filters
        if ("predDict" in spec) {
            cc.forEach(c => {
                c.predDict = spec.predDict;
            });
            delete spec.predDict;
        } else
            cc.forEach(c => {
                c.predDict = {};
            });

        // spec
        cc.forEach(c => {
            c.spec = spec;
        });

        // add to canvases array
        canvases = canvases.concat(cc);
    }

    // populate sampleFields of sa specs with dimensions
    // from other vis of the same table
    for (let c of canvases) {
        if (c.visDataMappings.type === "scatterplot") continue;
        for (let cc of canvases) {
            let spec = c.spec;
            if (
                cc.visDataMappings.type !== "scatterplot" &&
                cc.table === c.table
            ) {
                let dims = cc.spec.query.dimensions;
                if (cc.spec.query.stackDimensions)
                    dims = dims.concat(cc.spec.query.stackDimensions);
                dims.forEach(d => {
                    if (
                        !spec.query.sampleFields.includes(d) &&
                        !spec.query.dimensions.includes(d) &&
                        (!spec.query.stackDimensions ||
                            !spec.query.stackDimensions.includes(d)) &&
                        !spec.query.measure.includes(d)
                    )
                        spec.query.sampleFields.push(d);
                });
            }
        }
    }
}

function addDefaultWordClouds() {
    for (let t of tables) {
        // let allPks = getAllPks(t);
        let dimensions = pk[t][0];
        let sampleFields = keyColumns[t].filter(d => !dimensions.includes(d));
        sampleFields = sampleFields.concat(
            allColumns[t]
                .filter(
                    d =>
                        !dimensions.includes(d) &&
                        !sampleFields.includes(d) &&
                        !["kyrix_geo_x", "kyrix_geo_y"].includes(d)
                )
                .slice(0, Math.max(0, 10 - sampleFields.length))
        );

        let spec = {
            db: misc.db,
            query: {
                table: t,
                dimensions: dimensions,
                measure: "SUM(random() * 100)",
                sampleFields: sampleFields
            },
            type: "wordCloud",
            tooltip: {
                columns: dimensions,
                aliases: dimensions
            },
            padding: 15,
            legend: {
                title: `Primary keys of table ${t.toUpperCase()} (random text size)`
            },
            textFields: dimensions,
            cloud: {
                maxTextSize: 65,
                fontFamily: "Arial"
            },
            transition: false
        };

        // add to vis
        vis.push(spec);
    }
}

async function generateGIN() {
    for (let t of tables) {
        try {
            await client.query(
                `ALTER TABLE ${t} ADD COLUMN search_tsvector tsvector`
            );
            await client.query(
                `UPDATE ${t} SET search_tsvector = to_tsvector('simple', ${pk[
                    t
                ][0].join(" || ', ' || ")})`
            );
            await client.query(
                `CREATE INDEX on ${t} USING GIN(search_tsvector)`
            );
        } catch (e) {}
    }
}

function getAllPks(t) {
    let ret = [];
    for (let comb of pk[t])
        for (let d of comb) if (!ret.includes(d)) ret.push(d);
    return ret;
}

async function main() {
    // connect to postgres
    await client.connect();

    // get column list for each table using pg
    await getAllColumns();

    // for each table, get a list of key columns (columns matched to other tables)
    getKeyColumns();

    // construct word clouds, add in the vis array
    addDefaultWordClouds();

    // construct the canvases array
    constructCanvases();

    // generate metadata
    await generateMetadata();

    // generate kyrix spec
    genKyrixJS(canvases, appName);

    // generate inverted index for
    await generateGIN();
}

// pg client
const client = new psql.Client({
    host: "localhost",
    user: "kyrix",
    password: "kyrix_password",
    database: misc.db,
    port: "5433"
});

// main
main().then(() => {
    client.end();
});
