import React, {Component} from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import {githubGist} from "react-syntax-highlighter/dist/esm/styles/hljs";
import {Card, List, Breadcrumb, Dropdown, Menu} from "antd";
import {FilterOutlined, DownOutlined} from "@ant-design/icons";

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

        if (this.props.kyrixPredicates.length > 0)
            traversePredDict(this.props.kyrixPredicates[0]);
        return predicates;
    };

    render() {
        return (
            <div className="querydetails">
                <Card className="sqlquery" title="SQL Query" bordered={false}>
                    <SyntaxHighlighter
                        language="sql"
                        style={githubGist}
                        customStyle={{
                            lineHeight: 1.5,
                            fontSize: 13,
                            border: "white"
                        }}
                    >
                        {this.props.kyrixCanvas.length > 0
                            ? this.props.sqlQuery[this.props.kyrixCanvas]
                            : ""}
                    </SyntaxHighlighter>
                </Card>
                <Card className="filters" title="SQL Filters" bordered={false}>
                    <List
                        size="small"
                        dataSource={this.getSqlPredicates()}
                        renderItem={p => (
                            <div className="filter-item">
                                <FilterOutlined
                                    style={{paddingRight: "10px"}}
                                />{" "}
                                <b>{p.col}</b> = <i>{p.val}</i>
                            </div>
                        )}
                    />
                </Card>
                <Card
                    className="drill-down-path"
                    title={"Drill Down Path"}
                    bordered={false}
                >
                    <Breadcrumb>
                        <Breadcrumb.Item>building</Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <a>room.treemap</a>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <a>room.barchart</a>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>room.piechart</Breadcrumb.Item>
                    </Breadcrumb>
                </Card>
                <Card
                    className="rendering-parameter"
                    title={"Visualization Details"}
                    bordered={false}
                >
                    <div style={{display: "flex"}}>
                        <p style={{marginRight: "10px"}}>Visualization type:</p>
                        <p style={{marginRight: "10px"}}>Stacked bar chart</p>
                    </div>
                    <div style={{display: "flex"}}>
                        <p style={{marginRight: "10px"}}>Color Scheme:</p>
                        <Dropdown
                            overlay={
                                <Menu>
                                    <Menu.Item>blue-green</Menu.Item>
                                    <Menu.Item>red-purple</Menu.Item>
                                </Menu>
                            }
                        >
                            <a
                                className="ant-dropdown-link"
                                onClick={e => e.preventDefault()}
                            >
                                red-yellow <DownOutlined />
                            </a>
                        </Dropdown>
                    </div>
                </Card>

                <div className="explain">Query View</div>
            </div>
        );
    }
}

export default QueryDetails;
