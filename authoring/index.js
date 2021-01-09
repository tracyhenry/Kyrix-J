const appName = "mitdwh";
const vis = require(`./apps/${appName}/input/vis.json`);
const misc = require(`./apps/${appName}/input/misc.json`);
const pk = misc.pk;
const graph = misc.graph;

const helper = require("./helper");
const psql = require("pg");

async function main() {
    // connect to postgres
    await client.connect();

    // get column list for each table using pg
    let tables = Object.keys(pk);
    let allColumns = {};
    for (let i = 0; i < tables.length; i++) {
        let t = tables[i];
        let res = await client.query(`SELECT * FROM ${t} LIMIT 1;`);
        allColumns[t] = res.fields
            .filter(d => d !== "search_tsvector")
            .map(d => d.name);
    }

    // for each table, get a list of key columns (columns matched to other tables)
    let keyColumns = {};
    for (let i = 0; i < tables.length; i++) {
        let t = tables[i];
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
    for (let i = 0; i < tables.length; i++) {
        let t = tables[i];
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
    // type, canvasId, query, table, predDict, spec
    // that are useful in generating the metadata file
    let canvases = [];
    let ssvCounter = 0,
        saCounter = 0;
    for (let i = 0; i < vis.length; i++) {
        let spec = vis[i];
        let c = {};

        // decide if it's ssv or sa
        if ("layout" in spec) {
            // type
            c.type = "scatterplot";

            // canvas Id
            c.id = "ssv" + ssvCounter++;

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
        } else {
            // type
            c.type = spec.type;

            // canvas Id
            c.id = "staticAggregation" + saCounter++;

            // table
            c.table = spec.query.table;

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
        }

        // default filters
        if ("predDict" in spec) {
            c.predDict = spec.predDict;
            delete spec.predDict;
        } else c.predDict = {};

        // spec
        c.spec = spec;

        // add to canvases array
        canvases.push(c);
    }
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
