import React, {Component} from "react";
import {Image} from "antd";
import {ZoomInOutlined} from "@ant-design/icons";

class HistoryItem extends Component {
    state = {
        visible: false
    };
    render() {
        const clickHandler = e => {
            if (!e.target.classList.contains("history-clickable")) return;
            this.props.clickHandler(this.props.d);
        };
        return (
            <div
                className="img-container history-clickable"
                onClick={clickHandler.bind(this)}
            >
                <Image
                    src={this.props.d.url}
                    preview={{
                        visible: this.state.visible,
                        onVisibleChange: (value, prevValue) => {
                            if (value !== prevValue)
                                this.setState({
                                    visible: value
                                });
                        }
                    }}
                />
                <div className="img-info-area history-clickable">
                    <i>
                        <h4 className={"history-clickable"}>
                            {this.props.d.table}
                        </h4>
                    </i>
                    <ZoomInOutlined
                        className="history-clickable"
                        onClick={event => {
                            event.stopPropagation();
                            this.setState({visible: true});
                        }}
                    />
                </div>
            </div>
        );
    }
}

export default HistoryItem;
