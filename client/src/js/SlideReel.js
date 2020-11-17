import React, {Component} from "react";
import {Card, List, Image} from "antd";

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
                            <Card
                                bordered={false}
                                className="img-container"
                                cover={<Image src={d.url} />}
                            >
                                <Card.Meta
                                    title={d.table}
                                    style={{textAlign: "center"}}
                                />
                            </Card>
                        )}
                    />
                </Card>
                <div className="explain">History Slider View</div>
            </div>
        );
    }
}

export default SlideReel;
