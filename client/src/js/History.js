import React, {Component} from "react";
import {Drawer, List} from "antd";
import HistoryItem from "./low-level-components/HistoryItem";

class History extends Component {
    state = {};

    shouldComponentUpdate = nextProps =>
        nextProps.tableHistory.length ===
        nextProps.screenshotHistory.length + 1;

    render() {
        const listData = this.props.screenshotHistory
            .map((d, i) =>
                Object.assign({}, d, {table: this.props.tableHistory[i]})
            )
            .reverse();

        return (
            <Drawer
                title="History"
                className="slideshow"
                placement="left"
                onClose={this.props.handleHistoryVisibleChange}
                visible={this.props.visible}
            >
                <List
                    dataSource={listData}
                    renderItem={d => (
                        <HistoryItem
                            d={d}
                            clickHandler={this.props.handleHistoryItemClick}
                        />
                    )}
                />
                <div className="explain">History Slider View</div>
            </Drawer>
        );
    }
}

export default History;
