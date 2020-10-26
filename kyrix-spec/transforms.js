const Transform = require("../../src/Transform").Transform;

var roomTreemapStaticTransform = new Transform(
    "select fclt_building_key, organization_name, area from fclt_rooms;",
    "mit",
    "",
    [],
    true
);

var roomBarChartStaticTransform = new Transform(
    "select fclt_building_key, organization_name, use_desc, major_use_desc, area from fclt_rooms;",
    "mit",
    "",
    [],
    true
);

var roomCirclePackStaticTransform = new Transform(
    "select fclt_building_key, organization_name, building_room, use_desc, area from fclt_rooms;",
    "mit",
    "",
    [],
    true
);

var courseBarChartStaticTransform = new Transform(
    "select department_name, department_code, meet_place, total_units from course_catalog_subject_offered;",
    "mit",
    "",
    [],
    true
);

var studentPieChartStaticTransform = new Transform(
    "select student_year, office_location, department from mit_student_directory;",
    "mit",
    "",
    [],
    true
);

module.exports = {
    roomTreemapStaticTransform,
    roomBarChartStaticTransform,
    roomCirclePackStaticTransform,
    courseBarChartStaticTransform,
    studentPieChartStaticTransform
};
