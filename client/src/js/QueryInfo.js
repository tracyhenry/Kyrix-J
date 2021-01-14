import React, {Component} from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import {githubGist} from "react-syntax-highlighter/dist/esm/styles/hljs";
import {Card, List, Button} from "antd";
import {FilterOutlined} from "@ant-design/icons";
import {getSqlPredicates, dedupFilters} from "../helper";

class QueryInfo extends Component {
    state = {};

    shouldComponentUpdate = nextProps =>
        JSON.stringify(this.props) !== JSON.stringify(nextProps);

    render() {
        return (
            <div className="query-info">
                <Card
                    className={this.props.preview ? "" : "card-title-center"}
                    title={this.props.preview ? "New Query" : "Query"}
                    bordered={false}
                    extra={
                        !this.props.preview && (
                            <Button
                                type="link"
                                size="small"
                                onClick={
                                    this.props.handleRawDataTableVisibleChange
                                }
                            >
                                raw data
                            </Button>
                        )
                    }
                >
                    <SyntaxHighlighter language="sql" style={githubGist}>
                        {this.props.kyrixCanvas.length > 0
                            ? this.props.sqlQuery[this.props.kyrixCanvas]
                            : ""}
                    </SyntaxHighlighter>
                </Card>
                {!this.props.preview && (
                    <Card
                        className="filters card-title-center"
                        title="Filters"
                        bordered={false}
                    >
                        <List
                            size="small"
                            className="filter-list"
                            dataSource={dedupFilters(
                                getSqlPredicates(this.props.kyrixPredicates)
                            )}
                            renderItem={p => (
                                <div className="filter-item">
                                    <FilterOutlined /> <b>{p.col}</b> ={" "}
                                    <i>{p.val}</i>
                                </div>
                            )}
                        />
                    </Card>
                )}
            </div>
        );
    }
}

export default QueryInfo;
