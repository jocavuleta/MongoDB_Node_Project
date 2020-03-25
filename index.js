const { app, dbcon, mongo } = require('./core/app.config.js').AppConfig();

require('./controllers/main.controller.js').MainController(app, dbcon, mongo);
require('./controllers/state.controller.js').StateController(app, dbcon, mongo);
//require('./controllers/populatedPlace.controller.js').PopulatedPlaceController(app, dbcon, mongo);
require('./controllers/institution.controller.js').InstitutionController(app, dbcon);
require('./controllers/employees.controller.js').EmployeesController(app, dbcon);
require('./controllers/course.controller.js').CourseController(app, dbcon,mongo);

