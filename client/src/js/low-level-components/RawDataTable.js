import React, {Component} from "react";
import {Card, Table} from "antd";

class RawDataTable extends Component {

    shouldComponentUpdate = nextProps => {
        if (nextProps.maxHeight !== this.props.maxHeight)
            return true;
        if (nextProps.kyrixRenderData.length !== this.props.kyrixRenderData.length)
            return true;
        if (nextProps.kyrixRenderData.length === 0)
            return false;
        if (nextProps.kyrixRenderData[0].length !== this.props.kyrixRenderData[0].length)
            return true;
        let n = this.props.kyrixRenderData.length;
        let m = this.props.kyrixRenderData[0].length;
        for (let i = 0; i < n; i ++)
            for (let j = 0; j < m; j ++)
                if (nextProps.kyrixRenderData[i][j] !== this.props.kyrixRenderData[i][j])
                    return true;
        return false;
    };

    render() {
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

        let antdColumns = [toAntdColumn(this.props.primaryKey)];
        antdColumns = antdColumns.concat(
            rawColumns
                .filter(d => d !== this.props.primaryKey)
                .map(toAntdColumn)
        );

        const antdData = JSON.parse(
            JSON.stringify(this.props.kyrixRenderData.slice(0, 300))
        );
        antdData.forEach((d, i) => {
            d.key = JSON.stringify(d) + i;
        });

        return (
            <div className="rawdata">
                <Card title="Current Raw Data">
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
