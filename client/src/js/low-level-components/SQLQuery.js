import React, {Component} from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import {githubGist} from "react-syntax-highlighter/dist/esm/styles/hljs";
import {Card} from "antd";

class SQLQuery extends Component {
    state = {};

    render() {
        return (
            <Card
                className="sql-query"
                title={this.props.preview ? "New Query" : "Query"}
                bordered={false}
            >
                <SyntaxHighlighter language="sql" style={githubGist}>
                    {this.props.kyrixCanvas.length > 0
                        ? this.props.sqlQuery[this.props.kyrixCanvas]
                        : ""}
                </SyntaxHighlighter>
            </Card>
        );
    }
}

export default SQLQuery;
