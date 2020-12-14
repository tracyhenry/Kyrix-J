import React, {Component} from "react";
import {Descriptions, Card} from "antd";

class VisualDataMappings extends Component {
    state = {};

    render() {
        let m = this.props.m;
        if (m == null) return null;
        let visType = m.type;
        let content = null;
        if (visType === "scatterplot")
            content = (
                <>
                    <Descriptions.Item label="X Axis">{m.x}</Descriptions.Item>
                    <Descriptions.Item label="Y Axis">{m.y}</Descriptions.Item>
                    <Descriptions.Item label="Point Size">
                        {m.dot_size}
                    </Descriptions.Item>
                    <Descriptions.Item label="Point Color">
                        {m.dot_color}
                    </Descriptions.Item>
                </>
            );
        else if (visType === "treemap")
            content = (
                <>
                    <Descriptions.Item label="Rectangle Size">
                        {m.rect_size}
                    </Descriptions.Item>
                    <Descriptions.Item label="Rectangle Color">
                        {m.rect_color}
                    </Descriptions.Item>
                </>
            );
        else if (visType === "barchart")
            content = (
                <>
                    <Descriptions.Item label="X Axis">{m.x}</Descriptions.Item>
                    <Descriptions.Item label="Y Axis">{m.y}</Descriptions.Item>
                    {"bar_color" in m ? (
                        <Descriptions.Item label="Bar Color">
                            {m.bar_color}
                        </Descriptions.Item>
                    ) : null}
                </>
            );
        else if (visType === "circlepack")
            content = (
                <>
                    <Descriptions.Item label="Circle Size">
                        {m.circle_radius}
                    </Descriptions.Item>
                    <Descriptions.Item label="Circle Color">
                        {m.circle_color}
                    </Descriptions.Item>
                </>
            );
        else if (visType === "piechart")
            content = (
                <>
                    <Descriptions.Item label="Pie Color">
                        {m.pie_color}
                    </Descriptions.Item>
                </>
            );

        return (
            <Card
                className="vis-data-mapping"
                title={"Visual-Data Mappings"}
                bordered={false}
            >
                <Descriptions bordered size="small" column={2}>
                    {content}
                </Descriptions>
            </Card>
        );
    }
}

export default VisualDataMappings;
