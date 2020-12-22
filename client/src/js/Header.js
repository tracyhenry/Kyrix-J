import React, {Component} from "react";
import {Input, AutoComplete, Tag} from "antd";
import {
    createFromIconfontCN,
    HistoryOutlined,
    SyncOutlined
} from "@ant-design/icons";
const {Option} = AutoComplete;

class Header extends Component {
    constructor(props) {
        super(props);
        this.IconFont = createFromIconfontCN({
            scriptUrl: "//at.alicdn.com/t/font_2257494_xqvvxo50lt.js"
        });
    }

    render() {
        let options = [];
        if (
            this.props.options.length === 1 &&
            this.props.options[0].type === "wait"
        )
            options.push(
                <Option key="kyrixj-header-wait">
                    <div className="result-spin">
                        <SyncOutlined spin />
                    </div>
                </Option>
            );
        else
            options = this.props.options.map(res => ({
                value: res.value,
                label: (
                    <div key={res.value} className="search-result">
                        <p style={{float: "left", marginBottom: "0px"}}>
                            {res.value}
                        </p>
                        <Tag color="geekblue" style={{float: "right"}}>
                            {res.type}
                        </Tag>
                    </div>
                )
            }));
        return (
            <div className="kyrixjheader">
                <div
                    className="header-button-div"
                    onClick={this.props.handleHistoryVisibleChange}
                >
                    <HistoryOutlined className="header-button" />
                    History
                </div>
                <div
                    className="header-button-div"
                    onClick={this.props.handleBookmarksVisibleChange}
                >
                    <this.IconFont
                        type="icon-weibiaoti15"
                        className="header-button"
                    />
                    Bookmarks
                </div>
                <p className="header-title">Superman @ MIT Data Warehouse</p>
                <AutoComplete
                    className="header-input"
                    notFoundContent="No matches found."
                    // children={(<Input.Search size="large" placeholder="Search for a starting table..."/>)}
                    options={options}
                    value={this.props.searchBarValue}
                    dropdownMatchSelectWidth={500}
                    defaultActiveFirstOption={false}
                    // onSelect={this.props.handleClick}
                    onSearch={this.props.handleSearchBarInputChange}
                >
                    <Input.Search
                        size="large"
                        placeholder="Search for a starting table..."
                    />
                </AutoComplete>
            </div>
        );
    }
}

export default Header;
