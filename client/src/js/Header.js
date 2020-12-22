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
        if (Object.keys(this.props.searchResults).length === 0)
            options.push(
                <Option key="kyrixj-header-wait">
                    <div className="result-spin">
                        <SyncOutlined spin />
                    </div>
                </Option>
            );
        else {
            let tables = Object.keys(this.props.searchResults);
            for (let i = 0; i < tables.length; i++) {
                let t = tables[i];
                if (this.props.searchResults[t].length === 0) continue;
                options.push({
                    value: t,
                    label: (
                        <div className="search-result" key={t}>
                            <div className="search-result-title">
                                Table <i>{t}</i>
                            </div>
                            {this.props.searchResults[t]
                                .filter(res => res.type !== "table_name")
                                .map(res => (
                                    <div className={"search-result-item"}>
                                        <p>{res.value}</p>
                                        <Tag color="geekblue">{res.type}</Tag>
                                    </div>
                                ))}
                        </div>
                    )
                });
            }
        }
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
