import React, {Component} from "react";
import {Card, List} from "antd";
import HistoryItem from "./low-level-components/HistoryItem";

class SlideReel extends Component {
    state = {};

    shouldComponentUpdate = nextProps =>
        nextProps.tableHistory.length ===
        nextProps.screenshotHistory.length + 1;

    render() {
        const listData = this.props.screenshotHistory
            .map((d, i) => ({
                url: d,
                table: this.props.tableHistory[i]
            }))
            .reverse();

        return (
            <div className="slidereel">
                <Card title="History" className="slideshow">
                    <List
                        dataSource={listData}
                        renderItem={d => (
                            <HistoryItem url={d.url} table={d.table} />
                        )}
                    />
                </Card>
                <div className="explain">History Slider View</div>
            </div>
        );
    }
}

export default SlideReel;
