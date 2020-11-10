import React, {Component} from "react";
import {Input, AutoComplete} from "antd";

class Header extends Component {
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
                Superman @ MIT Data Warehouse
                <AutoComplete
                    // dropdownClassName="certain-category-search-dropdown"
                    // dropdownMatchSelectWidth={500}
                    style={{
                        width: 300,
                        position: "absolute",
                        top: "2px",
                        right: "5px"
                    }}
                    options={options}
                    value={this.props.searchBarValue}
                    onSelect={this.props.handleClick}
                    onSearch={this.props.handleSearchBarChange}
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
