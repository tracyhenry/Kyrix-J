import React from "react";
import ReactDOM from "react-dom";
import "./css/index.css";
import "./css/Kyrix.css";
import "./css/Header.css";
import "./css/SchemaGraph.css";
import "./css/QueryInfo.css";
import "./css/KyrixVis.css";
import "./css/History.css";
import "./css/RawDataTable.css";
import "./css/JumpPreview.css";
import "./css/VisualDataMapping.css";
import "antd/dist/antd.css";
import KyrixJ from "./KyrixJ";

ReactDOM.render(<KyrixJ />, document.getElementById("root"));
