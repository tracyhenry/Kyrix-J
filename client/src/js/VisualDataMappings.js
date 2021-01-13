import React, {Component} from "react";
import {Descriptions, Card} from "antd";

class VisualDataMappings extends Component {
    state = {};

    shouldComponentUpdate = nextProps =>
        JSON.stringify(this.props) !== JSON.stringify(nextProps);

    render() {
        let m = this.props.m;
        if (m == null) return null;
        let visType = m.type;
        let content = null;
        if (visType === "scatterplot")
            content = (
                <>
                    <Descriptions.Item label="Vis Type">
                        Scatterplot
                    </Descriptions.Item>
                    <Descriptions.Item label="X Axis">{m.x}</Descriptions.Item>
                    <Descriptions.Item label="Y Axis">{m.y}</Descriptions.Item>
                    {m.dot_size && (
                        <Descriptions.Item label="Point Size">
                            {m.dot_size}
                        </Descriptions.Item>
                    )}
                    {m.dot_color && (
                        <Descriptions.Item label="Point Color">
                            {m.dot_color}
                        </Descriptions.Item>
                    )}
                </>
            );
        else if (visType === "treemap")
            content = (
                <>
                    <Descriptions.Item label="Vis Type">
                        Tree Map
                    </Descriptions.Item>
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
                    <Descriptions.Item label="Vis Type">
                        Bar Chart
                    </Descriptions.Item>
                    <Descriptions.Item label="X Axis">{m.x}</Descriptions.Item>
                    <Descriptions.Item label="Y Axis">{m.y}</Descriptions.Item>
                    {m.bar_color && (
                        <Descriptions.Item label="Bar Color">
                            {m.bar_color}
                        </Descriptions.Item>
                    )}
                </>
            );
        else if (visType === "circlepack")
            content = (
                <>
                    <Descriptions.Item label="Vis Type">
                        Circle Pack
                    </Descriptions.Item>
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
                    <Descriptions.Item label="Vis Type">
                        Pie Chart
                    </Descriptions.Item>
                    <Descriptions.Item label="Pie Color">
                        {m.pie_color}
                    </Descriptions.Item>
                    <Descriptions.Item label="Pie Angle">
                        {m.pie_angle}
                    </Descriptions.Item>
                </>
            );
        else if (visType === "wordcloud")
            content = (
                <>
                    <Descriptions.Item label="Vis Type">
                        Word Cloud
                    </Descriptions.Item>
                    <Descriptions.Item label="Word Column">
                        {m.word_column}
                    </Descriptions.Item>
                    <Descriptions.Item label="Word Size">
                        {m.word_size}
                    </Descriptions.Item>
                </>
            );

        return (
            <Card
                className="vis-data-mapping card-title-center"
                title={"Visual-Data Mappings"}
                bordered={false}
            >
                <Descriptions bordered size="small" column={1}>
                    {content}
                </Descriptions>
            </Card>
        );
    }
}

export default VisualDataMappings;
