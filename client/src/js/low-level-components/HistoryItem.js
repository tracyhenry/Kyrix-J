import React, {Component} from "react";
import {Image} from "antd";
import {ZoomInOutlined} from "@ant-design/icons";

class HistoryItem extends Component {
    state = {
        visible: false
    };
    render() {
        const clickHandler = () => {
            this.props.clickHandler(this.props.d);
        };
        return (
            <div className="img-container" onClick={clickHandler.bind(this)}>
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
                <div className="img-info-area">
                    <i>
                        <h4>{this.props.d.table}</h4>
                    </i>
                    <ZoomInOutlined
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
