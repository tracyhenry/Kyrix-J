import React, {Component} from "react";
import {Card, List} from "antd";
import {FilterOutlined} from "@ant-design/icons";

class Filters extends Component {
    state = {};

    render() {
        return (
            <Card className="filters" title="Filters" bordered={false}>
                <List
                    size="small"
                    dataSource={this.props.getSqlPredicates(
                        this.props.kyrixPredicates
                    )}
                    renderItem={p => (
                        <div className="filter-item">
                            <FilterOutlined /> <b>{p.col}</b> = <i>{p.val}</i>
                        </div>
                    )}
                />
            </Card>
        );
    }
}

export default Filters;
