const appName = "mitdwh";
const vis = require(`./apps/${appName}/input/vis.json`);
const misc = require(`./apps/${appName}/input/misc.json`);
const pk = misc.pk;
const graph = misc.graph;

const psql = require("pg");
const client = new psql.Client({
    host: "localhost",
    user: "kyrix",
    password: "kyrix_password",
    database: misc.db,
    port: "5433"
});

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
        let sampleFields = pk[t];
        keyColumns[t].forEach(d => {
            if (!sampleFields.includes(d)) sampleFields.push(d);
        });
        sampleFields = sampleFields.concat(
            allColumns[t]
                .filter(d => !sampleFields.includes(d))
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
    // id, query, type, table, predDict, spec
    // that are useful in generating the metadata file
    let canvases = [];
}

// run
main().then(() => {
    client.end();
});
