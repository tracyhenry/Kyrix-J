const express = require("express");
const app = express();
const port = 3001;
const psql = require("pg");

app.get("/", (req, res) => {
    let client = new psql.Client({
        host: "localhost",
        user: "wenbo",
        password: "",
        database: "nba"
    });

    client.connect();
    client.query("SELECT count(*) from plays;", (err, result) => {
        res.status(200).send(
            "Total rows in the plays table: " + JSON.stringify(result)
        );
    });
});

app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});
