import React, {Component} from "react";

class TableDetails extends Component {
    state = {};

    render() {
        return (
            <div className="tabledetails">
                <div className="searchbar">
                    <input
                        type="text"
                        size="30"
                        placeholder="Search for a table..."
                    />
                </div>
                <div className="tablelist">
                    <ul className="tablelistul">
                        <li>Rooms</li>
                        <li>Buildings</li>
                        <li>Students</li>
                        <li>Courses</li>
                    </ul>
                </div>
                <div className="schemadetails">
                    <style type="text/css"></style>
                    <table className="curtable">
                        <thead>
                            <tr>
                                <th className="tg-76qt">Buildings</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="tg-76qt">building_number</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">campus_sector</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">assignable_area</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">building_use</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">latitude</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">ownership_type</td>
                            </tr>
                            <tr>
                                <td className="tg-76qt">building_height</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="explain">Table Details View</div>
            </div>
        );
    }
}

export default TableDetails;
