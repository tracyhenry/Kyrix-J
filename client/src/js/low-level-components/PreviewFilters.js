import React, {Component} from "react";
import {Card, List, Tag} from "antd";
import {FilterOutlined} from "@ant-design/icons";

class PreviewFilters extends Component {
    state = {};

    render() {
        let newPredicates = this.props.getSqlPredicates(
            this.props.kyrixPredicates
        );
        let oldPredicates = this.props.getSqlPredicates(
            window.kyrix.getGlobalVarDictionary(this.props.kyrixViewId)
                .predicates
        );

        // construct list data
        let listData = [];
        oldPredicates.forEach(d => {
            let exist = false;
            for (let i = 0; i < newPredicates.length; i++)
                if (
                    newPredicates[i].col === d.col &&
                    newPredicates[i].val === d.val
                ) {
                    exist = true;
                    break;
                }
            let type = exist ? "current" : "old";
            listData.push({type: type, pred: d});
        });
        newPredicates.forEach(d => {
            for (let i = 0; i < oldPredicates.length; i++)
                if (
                    oldPredicates[i].col === d.col &&
                    oldPredicates[i].val === d.val
                )
                    return;
            listData.push({type: "new", pred: d});
        });

        return (
            <Card
                className="filters preview-filters"
                title="Filters"
                bordered={false}
            >
                <List
                    size="small"
                    dataSource={listData}
                    renderItem={p => {
                        if (p.type === "old") {
                            return (
                                <div className="filter-item preview-filter-old">
                                    <FilterOutlined />{" "}
                                    <del>
                                        <b>{p.pred.col}</b> ={" "}
                                        <i>{p.pred.val}</i>
                                    </del>
                                </div>
                            );
                        } else if (p.type === "current") {
                            return (
                                <div className="filter-item preview-filter-current">
                                    <FilterOutlined /> <b>{p.pred.col}</b> ={" "}
                                    <i>{p.pred.val}</i>
                                </div>
                            );
                        } else if (p.type === "new") {
                            return (
                                <div className="filter-item">
                                    <FilterOutlined /> <b>{p.pred.col}</b> ={" "}
                                    <i>{p.pred.val}</i>&nbsp;&nbsp;
                                    <Tag color="geekblue">new</Tag>
                                </div>
                            );
                        }
                    }}
                />
            </Card>
        );
    }
}

export default PreviewFilters;
