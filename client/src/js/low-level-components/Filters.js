import React, {Component} from "react";
import {Card, List} from "antd";
import {FilterOutlined} from "@ant-design/icons";

class Filters extends Component {
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
            <Card className="filters" title="SQL Filters" bordered={false}>
                <List
                    size="small"
                    dataSource={this.getSqlPredicates()}
                    renderItem={p => (
                        <div className="filter-item">
                            <FilterOutlined style={{paddingRight: "10px"}} />{" "}
                            <b>{p.col}</b> = <i>{p.val}</i>
                        </div>
                    )}
                />
            </Card>
        );
    }
}

export default Filters;
