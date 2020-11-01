import React, {Component} from "react";

class SchemaDetails extends Component {
    render() {
        const curTable = this.props.curTable;
        const trList =
            curTable &&
            this.props.columns.slice(0, 8).map(col => (
                <tr key={col}>
                    <td className="tg-76gt">{col}</td>
                </tr>
            ));
        return (
            <div className="schemadetails">
                {curTable && (
                    <table className="curtable">
                        <thead>
                            <tr>
                                <th className="tg-76qt">{curTable}</th>
                            </tr>
                        </thead>
                        <tbody>{trList}</tbody>
                    </table>
                )}
            </div>
        );
    }
}

export default SchemaDetails;
