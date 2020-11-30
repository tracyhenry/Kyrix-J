const Transform = require("../../src/Transform").Transform;

var roomBarChartStaticTransform = new Transform(
    "select building_room, fclt_building_key, organization_name, use_desc, major_use_desc, area from fclt_rooms;",
    "mit",
    "",
    [],
    true
);

var courseBarChartStaticTransform = new Transform(
    "select subject_title, department_name, department_code, meet_place, total_units from course_catalog_subject_offered;",
    "mit",
    "",
    [],
    true
);

module.exports = {
    roomBarChartStaticTransform,
    courseBarChartStaticTransform
};
