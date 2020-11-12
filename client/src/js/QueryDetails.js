import React, {Component} from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import {githubGist} from "react-syntax-highlighter/dist/esm/styles/hljs";
import {Divider} from "antd";

class QueryDetails extends Component {
    state = {};

    getSqlPredicates = () => {
        let predicates = [];
        let traversePredDict = pd => {
            if ("==" in pd) {
                predicates.push({
                    col: pd["=="][0].toString().replace(/&/g, "%26"),
                    val: pd["=="][1].toString().replace(/&/g, "%26")
                });
                return;
            }
            if ("AND" in pd) {
                traversePredDict(pd["AND"][0]);
                traversePredDict(pd["AND"][1]);
            }
        };

        for (let i = 0; i < this.props.kyrixPredicates.length; i++)
            traversePredDict(this.props.kyrixPredicates[i]);
        return predicates;
    };

    render() {
        let predLis = this.getSqlPredicates().map(p => (
            <li key={this.props.kyrixCanvas + "-" + p.col + "=" + p.val}>
                <b>{p.col}</b> = <i>{p.val}</i>
            </li>
        ));
        return (
            <div className="querydetails">
                <div className="sqlquerydiv">
                    <Divider className="header" orientation="left">
                        Current SQL Query
                    </Divider>
                    <div className="sqlquery">
                        <SyntaxHighlighter
                            language="sql"
                            style={githubGist}
                            customStyle={{
                                lineHeight: 1.5,
                                fontSize: 15,
                                border: "white"
                            }}
                        >
                            {this.props.kyrixCanvas.length > 0
                                ? this.props.sqlQuery[this.props.kyrixCanvas]
                                : ""}
                        </SyntaxHighlighter>
                    </div>
                </div>
                <div className="filterdiv">
                    <Divider className="header" orientation="left">
                        Current SQL Filters
                    </Divider>
                    <ul>{predLis}</ul>
                </div>

                <div className="explain">Query View</div>
            </div>
        );
    }
}

export default QueryDetails;
