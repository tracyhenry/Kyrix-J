import React, {Component} from "react";
import {Input, AutoComplete} from "antd";
import {HistoryOutlined} from "@ant-design/icons";
import {createFromIconfontCN} from "@ant-design/icons";

class Header extends Component {
    constructor(props) {
        super(props);
        this.IconFont = createFromIconfontCN({
            scriptUrl: "//at.alicdn.com/t/font_2257494_xqvvxo50lt.js"
        });
    }

    findMatchingTables = () => {
        // find matching tables
        let value = this.props.searchBarValue;
        let columns = this.props.tableColumns;
        let matchingTables = [];
        for (let table in columns) {
            let match = false;
            for (let i = 0; i < columns[table].length; i++) {
                if (
                    columns[table][i]
                        .toLowerCase()
                        .startsWith(value.toLowerCase())
                ) {
                    match = true;
                    break;
                }
            }
            if (table.toLowerCase().startsWith(value.toLowerCase()))
                match = true;
            if (match) matchingTables.push({value: table, label: table});
        }
        return matchingTables;
    };

    render() {
        let options = this.findMatchingTables();
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
                    options={options}
                    notFoundContent="No matching tables."
                    value={this.props.searchBarValue}
                    onSelect={this.props.handleClick}
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
