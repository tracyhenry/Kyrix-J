const express = require("express");
const psql = require("pg");
const data = require("../src/metadata/mitdwh.json");

const app = express();
const port = 3001;
const client = new psql.Client({
    host: "localhost",
    user: "kyrix",
    password: "kyrix_password",
    database: "mit",
    port: "5433"
});
client.connect();

app.get("/search", (req, res) => {
    let s = req.query.q;
    let results = {};

    // loop through all tables
    let tables = Object.keys(data.tableColumns);
    let promises = [];
    for (let i = 0; i < tables.length; i++) {
        let t = tables[i];
        results[t] = [];

        // table name
        if (t.toLowerCase().includes(s))
            results[t].push({
                type: "table_name",
                value: t
            });
        if (s.length === 0 || s.indexOf(" ") >= 0) continue;

        // column names
        for (let j = 0; j < data.tableColumns[t].length; j++) {
            let c = data.tableColumns[t][j];
            if (c.toLowerCase().includes(s))
                results[t].push({
                    type: "column_name",
                    value: c
                });
        }

        // primary key values - talk to postgres
        let primaryKey = data.primaryKeys[t][0]
            .toLowerCase()
            .split(" ")
            .join("_");
        let query =
            `SELECT distinct(${primaryKey}) as value FROM ${t.toLowerCase()}` +
            ` WHERE to_tsquery('simple', '${s}:*') @@ search_tsvector LIMIT 5;`;
        let p = client.query(query);
        promises.push(
            p
                .then(result => {
                    let len = result.rows.length;
                    for (let j = 0; j < len; j++)
                        results[t].push({
                            type: "pk_value",
                            value: result.rows[j].value
                        });
                })
                .catch(e => console.log(e))
        );
    }

    Promise.all(promises).then(() => {
        res.status(200).send({query: s, results: results});
    });
});

// app.get("/test", (req, res) => {
//     client.query("SELECT * FROM fclt_building LIMIT 10;").then(result => {
//         res.status(200).send(result);
//     });
// });

app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});
