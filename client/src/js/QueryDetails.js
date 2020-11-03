import React, {Component} from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import {githubGist} from "react-syntax-highlighter/dist/esm/styles/hljs";

class QueryDetails extends Component {
    state = {};

    render() {
        return (
            <div className="querydetails">
                <div className="sqlquerydiv">
                    <h4>Current SQL query</h4>
                    <div className="sqlquery">
                        <SyntaxHighlighter language="sql" style={githubGist}>
                            {this.props.curCanvas.length > 0
                                ? this.props.sqlQuery[this.props.curCanvas]
                                : ""}
                        </SyntaxHighlighter>
                    </div>
                </div>
                <div className="filterdiv">
                    <h4>Drill down filters</h4>
                    <ul>
                        <li>'building_number' = 32</li>
                        <li>'building_use' = 'academic'</li>
                    </ul>
                </div>

                <div className="explain">Query View</div>
            </div>
        );
    }
}

export default QueryDetails;
