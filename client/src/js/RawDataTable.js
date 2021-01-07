import React, {Component} from "react";
import {Card, Table} from "antd";

class RawDataTable extends Component {
    shouldComponentUpdate = nextProps => {
        if (nextProps.maxHeight !== this.props.maxHeight) return true;
        if (
            nextProps.kyrixRenderData.length !==
            this.props.kyrixRenderData.length
        )
            return true;
        if (nextProps.kyrixRenderData.length === 0) return false;
        let oldFields = Object.keys(this.props.kyrixRenderData[0]);
        let newFields = Object.keys(nextProps.kyrixRenderData[0]);
        if (oldFields.sort().join("_") !== newFields.sort().join("_"))
            return true;
        let n = this.props.kyrixRenderData.length;
        for (let i = 0; i < n; i++)
            for (let j = 0; j < oldFields.length; j++)
                if (
                    nextProps.kyrixRenderData[i][oldFields[j]] !==
                    this.props.kyrixRenderData[i][oldFields[j]]
                )
                    return true;
        return false;
    };

    render() {
        const curTable = this.props.curTable;
        const primaryKeys =
            curTable.length > 0 ? this.props.primaryKeys[curTable] : [];

        const rawColumns = Object.keys(
            this.props.kyrixRenderData.length > 0
                ? this.props.kyrixRenderData[0]
                : {}
        ).filter(
            d =>
                d !== "minx" &&
                d !== "miny" &&
                d !== "maxx" &&
                d !== "maxy" &&
                d !== "cx" &&
                d !== "cy" &&
                d !== "clusterAgg" &&
                d !== "?column?"
        );

        let toAntdColumn = d => ({
            title: d,
            dataIndex: d,
            key: d,
            width: d ? d.length * 10 : 0,
            align: "center"
        });

        // columns
        let antdColumns = primaryKeys.map(d => toAntdColumn(d));
        antdColumns = antdColumns.concat(
            rawColumns.filter(d => !primaryKeys.includes(d)).map(toAntdColumn)
        );

        // data
        const antdData = JSON.parse(
            JSON.stringify(this.props.kyrixRenderData.slice(0, 300))
        );
        antdData.forEach((d, i) => {
            d.key = JSON.stringify(d) + i;
        });

        // set width for columns
        for (let i = 0; i < antdColumns.length; i++)
            for (let j = 0; j < antdData.length; j++) {
                let cell = antdData[j][antdColumns[i].title];
                if (cell == null) continue;

                // update column width
                antdColumns[i].width = Math.max(
                    antdColumns[i].width,
                    cell.toString().length * 10
                );

                // set number format
                if (cell.length > 0 && !isNaN(cell))
                    antdData[j][antdColumns[i].title] = (+cell)
                        .toFixed(2)
                        .replace(/\.?0*$/, "");
            }

        return (
            <div className="rawdata">
                <Card title="Sample Raw Data">
                    <Table
                        size="small"
                        columns={antdColumns}
                        dataSource={antdData}
                        pagination={{defaultPageSize: 25}}
                        scroll={{y: this.props.maxHeight}}
                    />
                </Card>
            </div>
        );
    }
}

export default RawDataTable;
