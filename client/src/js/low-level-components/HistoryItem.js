import React, {Component} from "react";
import {Image} from "antd";
import {ZoomInOutlined} from "@ant-design/icons";

class HistoryItem extends Component {
    state = {
        visible: false
    };
    render() {
        return (
            <div className="img-container">
                <Image
                    src={this.props.url}
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
                <div className="img-info-area">
                    <i>
                        <h4>{this.props.table}</h4>
                    </i>
                    <ZoomInOutlined
                        onClick={() => this.setState({visible: true})}
                    />
                </div>
            </div>
        );
    }
}

export default HistoryItem;
