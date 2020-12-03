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
        const primaryKey =
            curTable.length > 0
                ? this.props.tableColumns[curTable][0]
                      .toLowerCase()
                      .split(" ")
                      .join("_")
                : "";

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
                d !== "clusterAgg"
        );

        let toAntdColumn = d => ({
            title: d,
            dataIndex: d,
            key: d,
            ellipsis: true
        });

        let antdColumns = [toAntdColumn(primaryKey)];
        antdColumns = antdColumns.concat(
            rawColumns.filter(d => d !== primaryKey).map(toAntdColumn)
        );

        const antdData = JSON.parse(
            JSON.stringify(this.props.kyrixRenderData.slice(0, 300))
        );
        antdData.forEach((d, i) => {
            d.key = JSON.stringify(d) + i;
        });

        return (
            <div className="rawdata">
                <Card title="Sample Raw Data">
                    <Table
                        size="small"
                        columns={antdColumns}
                        dataSource={antdData}
                        pagination={{defaultPageSize: 50}}
                        scroll={{x: true, y: this.props.maxHeight}}
                    />
                </Card>
            </div>
        );
    }
}

export default RawDataTable;
