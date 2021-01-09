const appName = "mitdwh";
const vis = require(`./apps/${appName}/input/vis.json`);
const misc = require(`./apps/${appName}/input/misc.json`);
const pk = misc.pk;
const graph = misc.graph;

const helper = require("./helper");
const psql = require("pg");

// global variables
let allColumns, keyColumns, canvases;

async function generateMetadata() {
    // generate metadata
    let metadata = {};

    // view Id
    metadata.kyrixViewId =
        canvases[0].visDataMappings.type === "scatterplot"
            ? `ssv0`
            : canvases[0].id;

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
    let tables = Object.keys(pk);
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
            canvasId: c.id,
            predDict: c.predDict,
            newVpX: 0,
            newVpY: 0
        });
    });

    // write to output file
    helper.writeJSON(metadata, `apps/${appName}/output/${appName}.json`);
}

async function main() {
    // connect to postgres
    await client.connect();

    // get column list for each table using pg
    let tables = Object.keys(pk);
    allColumns = {};
    for (let t of tables) {
        let res = await client.query(`SELECT * FROM ${t} LIMIT 1;`);
        allColumns[t] = res.fields
            .filter(d => d !== "search_tsvector")
            .map(d => d.name);
    }

    // for each table, get a list of key columns (columns matched to other tables)
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

    // construct word clouds, put in the vis array
    for (let t of tables) {
        let sampleFields = keyColumns[t].filter(d => !pk[t].includes(d));
        sampleFields = sampleFields.concat(
            allColumns[t]
                .filter(d => !pk[t].includes(d) && !sampleFields.includes(d))
                .slice(0, Math.max(0, 10 - sampleFields.length))
        );
        let spec = {
            db: misc.db,
            query: {
                table: t,
                dimensions: pk[t],
                measure: "SUM(random() * 100)",
                sampleFields: sampleFields
            },
            type: "wordCloud",
            tooltip: {
                columns: pk[t],
                aliases: pk[t]
            },
            padding: 15,
            legend: {
                title: `Primary keys of table ${t.toUpperCase()} (random text size)`
            },
            textFields: [pk[t][0]],
            cloud: {
                maxTextSize: 65,
                fontFamily: "Arial"
            }
        };

        // add to vis
        vis.push(spec);
    }

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

            // one canvas per level
            for (let j = 0; j < numLevels; j++) {
                let c = {};

                // vis data mapping
                c.visDataMappings = vdm;

                // canvas Id
                c.id = `ssv${ssvId}_level${j}`;

                // query
                c.query = helper.formatSQL(spec.data.query);

                // table
                let s = c.query.substring(c.query.indexOf("FROM") + 4);
                let p = 0;
                for (; ; p++) if (s[p] !== " ") break;
                c.table = "";
                for (; p < s.length; p++)
                    if (s[p] === " " || s[p] === ";") break;
                    else c.table += s[p];
                c.table = c.table.toLowerCase();

                cc.push(c);
            }
        } else {
            let c = {};

            // vis data mapping
            switch (spec.type) {
                case "treemap":
                    c.visDataMappings = {
                        type: "treemap",
                        rect_size: spec.query.measure,
                        rect_color: spec.query.measure
                    };
                    break;
                case "circlePack":
                    c.visDataMappings = {
                        type: "circlepack",
                        circle_radius: spec.query.measure,
                        circle_color: spec.query.measure
                    };
                    break;
                case "pie":
                    c.visDataMappings = {
                        type: "piechart",
                        pie_color: spec.query.dimensions.join(", "),
                        pie_angle: spec.query.measure
                    };
                    break;
                case "bar":
                    c.visDataMappings = {
                        type: "barchart",
                        x: spec.query.dimensions.join(", "),
                        y: spec.query.measure
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
                        word_size: spec.query.measure.includes("random")
                            ? "random"
                            : spec.query.measure
                    };
                    break;
            }

            // canvas Id
            c.id = "staticAggregation" + saCounter++;

            // table
            c.table = spec.query.table.toLowerCase();

            // query
            if (spec.query.measure.includes("random"))
                c.query = "SELECT " + pk[c.table][0] + " FROM " + c.table;
            else {
                c.query = "SELECT ";
                let dimensions = spec.query.dimensions;
                if (spec.query.stackDimensions)
                    dimensions = dimensions.concat(spec.query.stackDimensions);
                c.query +=
                    dimensions.join(", ") +
                    ", " +
                    spec.query.measure +
                    " FROM " +
                    spec.query.table +
                    " GROUP BY " +
                    dimensions.join(", ") +
                    ";";
            }
            c.query = helper.formatSQL(c.query);

            // populate sampleFields with key columns if any of them don't exist
            let sf = spec.query.sampleFields;
            keyColumns[c.table]
                .concat(pk[c.table])
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
                let va = pk[c.table].includes(a)
                    ? 0
                    : keyColumns[c.table].includes(a)
                    ? 1
                    : 2;
                let vb = pk[c.table].includes(b)
                    ? 0
                    : keyColumns[c.table].includes(b)
                    ? 1
                    : 2;
                return va - vb;
            });

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

    // generate metadata
    await generateMetadata();

    // helper.writeJSON(canvases, "canvases.json");
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
