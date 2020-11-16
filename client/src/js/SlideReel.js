import React, {Component} from "react";
import {Card, List} from "antd";

class SlideReel extends Component {
    state = {};

    shouldComponentUpdate = nextProps =>
        nextProps.tableHistory.length ===
        nextProps.screenshotHistory.length + 1;

    render() {
        return (
            <div className="slidereel">
                <Card title="History" className="slideshow">
                    <List
                        bordered
                        dataSource={this.props.screenshotHistory
                            .slice(0)
                            .reverse()}
                        renderItem={(d, i) => (
                            <div key={i} className="img-container">
                                <img src={d} alt="ssv" />
                            </div>
                        )}
                    />
                </Card>
                <div className="explain">History Slider View</div>
            </div>
        );
    }
}

export default SlideReel;
