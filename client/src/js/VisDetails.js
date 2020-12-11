import React, {Component} from "react";
import QueryDetails from "./low-level-components/QueryDetails";
import {Dropdown, Menu, Card} from "antd";
import {DownOutlined} from "@ant-design/icons";

class VisDetails extends Component {
    render() {
        return (
            <div className="visdetails">
                <QueryDetails
                    kyrixCanvas={this.props.kyrixCanvas}
                    sqlQuery={this.props.sqlQuery}
                    kyrixPredicates={this.props.kyrixPredicates}
                />
                <Card
                    className="visual-encodings"
                    title={"Visualization Details"}
                    bordered={false}
                >
                    <div style={{display: "flex"}}>
                        <p style={{marginRight: "10px"}}>Visualization type:</p>
                        <p style={{marginRight: "10px"}}>Stacked bar chart</p>
                    </div>
                    <div style={{display: "flex"}}>
                        <p style={{marginRight: "10px"}}>Color Scheme:</p>
                        <Dropdown
                            overlay={
                                <Menu>
                                    <Menu.Item>blue-green</Menu.Item>
                                    <Menu.Item>red-purple</Menu.Item>
                                </Menu>
                            }
                        >
                            <a
                                className="ant-dropdown-link"
                                onClick={e => e.preventDefault()}
                            >
                                red-yellow <DownOutlined />
                            </a>
                        </Dropdown>
                    </div>
                </Card>
            </div>
        );
    }
}

export default VisDetails;
