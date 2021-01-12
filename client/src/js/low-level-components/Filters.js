import React, {Component} from "react";
import {Card, List} from "antd";
import {FilterOutlined} from "@ant-design/icons";
import {getSqlPredicates, dedupFilters} from "../../helper";

class Filters extends Component {
    state = {};

    render() {
        let filters = dedupFilters(
            getSqlPredicates(this.props.kyrixPredicates)
        );
        return (
            <Card className="filters" title="Filters" bordered={false}>
                <List
                    size="small"
                    dataSource={filters}
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
