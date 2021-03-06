exports.InstitutionController = function (app, dbcon, mongo, neo4j) {
    const institutionModel = require('../models/mysql/institution.model.js').InstitutionModel(dbcon);
    const employeesModel = require('../models/mysql/employees.model.js').EmployeesModel(dbcon);
    const courseModel = require('../models/mysql/course.model.js').CourseModel(dbcon);
    const stateModel = require('../models/mysql/state.model.js').StateModel(dbcon);
    const institutionCollection = require('../models/mongodb/institution.collection.js').InstitutionCollectionModel(mongo);
    const Neo4jInstitutionModel = require('../models/neo4j/institution.model.js').InstitutionModel(neo4j);

    app.get('/getAllInstitutions', (req, res) => {

        institutionModel.getAllInstitutions()
            .then((data) => {
                res.render('allInstitutions', {
                    institutions: data,
                    successMessage: ''
                });
            });
    });

    app.get('/getInstitutionsByStateId/:id', (req, res) => {

        let getAllTypes = InstitutionModel.getAllTypes().then();
        let institutions = InstitutionModel.getInstitutionsByStateId(req.params.id).then();
        let state = StateModel.getStateById(req.params.id).then();

        Promise.all([getAllTypes, institutions, state])
            .then((data) => {
                res.render('institutions', {
                    types: data[0],
                    institutions: data[1],
                    state: data[2][0],
                    successMessage: ''
                });
            });
    });

    app.get('/getEmployeeByInstitutionId/:id/:type', (req, res) => {
        employeesModel.getAllEmployeesByInstitution(req.params.id, req.params.type)
            .then((data) => {
                res.render('employees', {
                    employees: data,
                    employee: data[0]
                });
            })
            .catch((err) => {
                res.render('message', {
                    errorMessage: 'ERROR: ' + err,
                    link: '<a href="/getAllInstitutions"> Go Back</a>'
                });
            });
    });

    app.get('/getCoursesByInstitutionId/:id/:type', (req, res) => {
        institutionModel.getCourses(req.params.id, req.params.type)
            .then((data) => {
                res.render('courses', {
                    courses: data,
                    course: data[0],
                    vu_id: req.params.id,
                    tip_ust: req.params.type,
                    successMessage: ''
                });
            })
            .catch(err => {
                res.render('message', {
                    errorMessage: 'ERROR: ' + err,
                });
            });
    });

    app.get('/addInstitution/:state', (req, res) => {

        let getState = stateModel.getStateById(req.params.state).then();
        let getAllTypes = institutionModel.getAllTypes().then();
        let getAllOwnerships = institutionModel.getAllOwnerships().then();

        Promise.all([req.params.state, getAllTypes, getAllOwnerships, getState])
            .then((data) => {
                res.render('addInstitution', {
                    state: data[0],
                    types: data[1],
                    ownerships: data[2],
                    stateCurrent: data[3][0]
                });
            })
            .catch((err) => {
                res.render('message', {
                    errorMessage: 'ERROR: ' + err + '!',
                    link: 'ERROR: ' + err + ' <a href="/addInstitution">Goback!</a>'
                });
            })
    });

    app.post('/addInstitution/:state', (req, res) => {

        let getAllInstitutions = institutionModel.getAllInstitutions().then();
        let getInstitution = institutionModel.addInstitution(req.body.institutionId, req.body.institutionName, req.body.institutionType, req.params.state, req.body.ownershipType).then();
        let neoInstitution = Neo4jInstitutionModel.addInstitution(req.params.state, parseInt(req.body.institutionId), req.body.institutionName, req.body.institutionType, req.body.ownershipType).then();

        Promise.all([getAllInstitutions, getInstitution, neoInstitution])
            .then((data) => {
                res.redirect('/getInstitutionsByStateId/' + req.params.state);
            })
            .catch((err) => {
                res.render('message', {
                    errorMessage: 'ERROR: ' + err,
                    link: '<a href="/addInstitution"> Go Back</a>'
                });
            });
    });

    app.get('/editInstitutionById/:state/:id/:type', (req, res) => {
        let getAllTypes = institutionModel.getAllTypes();
        let getAllOwnerships = institutionModel.getAllOwnerships();
        let getInstitution = institutionModel.getInstitutionById(req.params.id, req.params.type);

        Promise.all([getInstitution, getAllTypes, getAllOwnerships])
            .then(data => {
                console.log(data);
                res.render('editInstitution', {
                    institution: data[0][0],
                    types: data[1],
                    ownerships: data[2]
                });
            })
    });

    app.post('/editInstitutionById/:state/:id/:type', (req, res) => {

        let editInstitutionSQL = institutionModel.editInstitutionById(req.body.institutionType, req.body.institutionName, req.body.ownershipType, req.params.id, req.params.type).then();
        let editInstitutionNeo = Neo4jInstitutionModel.editInstitutionById(req.params.state, parseInt(req.params.id), req.params.type, req.body.institutionName, req.body.institutionType, req.body.ownershipType).then();

        Promise.all([editInstitutionSQL, editInstitutionNeo])
            .then((data) => {
                res.redirect('/getInstitutionsByStateId/' + req.params.state);
            })
            .catch((err) => {
                res.render('message', {
                    errorMessage: 'ERROR: ' + err,
                    link: '<a href="/editInstitutionById/' + req.body.institutionId + ' "> Go back!</a>'
                });
            });
    });

    app.get('/deleteInstitutionById/:state/:id/:type', (req, res) => {

        let mysqlDeletePromise = institutionModel.deleteInstitutionById(req.params.id, req.params.type).then();
        let neo4jDeletePromise = Neo4jInstitutionModel.deleteInstitutionById(parseInt(req.params.id), req.params.type).then();

        Promise.all([mysqlDeletePromise, neo4jDeletePromise])
            .then((data) => {
                res.redirect('/getInstitutionsByStateId/' + req.params.state);
            })
            .catch((err) => {
                res.render('message', {
                    errorMessage: 'ERROR: ' + err,
                    link: '<a href="/getAllInstitutions"> Go Back</a>'
                });
            });
    });

    app.get('/institutionsDocuments', (req, res) => {
        institutionCollection.getAllInstitutionDocuments()
            .then((data) => {
                res.render('institutionDocuments', {
                    documents: data
                })
            })
            .catch((err) => {
                res.render('message', {
                    errorMessage: 'ERROR: ' + err,
                    link: '<a href="/getAllInstitutions"> Go Back</a>'
                })
            });
    });

    app.get('/generateInstitutionsDocument', (req, res) => {
        const allStates = stateModel.getAllStates();
        const allInstitutions = institutionModel.getAllInstitutions();
        const allEmployees = employeesModel.getAllEmployees();
        const allCourses = courseModel.allCourses();

        Promise.all([allStates, allInstitutions, allEmployees, allCourses])
            .catch((err) => {
                res.render('message', {
                    errorMessage: 'ERROR: ' + err,
                    link: '<a href="/getAllInstitutions"> Go Back</a>'
                })
            })
            .then(([states, institutions, employees, courses]) => {
                return new Promise((resolve, reject) => {

                    institutionDocument = states.map(state => {
                        return {
                            id: state.DR_IDENTIFIKATOR,
                            name: state.DR_NAZIV,
                            institutions: institutions.filter(institution => institution.DR_IDENTIFIKATOR == state.DR_IDENTIFIKATOR)
                                .map(institution => {
                                    return {
                                        id: institution.VU_IDENTIFIKATOR,
                                        name: institution.VU_NAZIV,
                                        number_of_employees: employees.filter(employee => employee.VU_IDENTIFIKATOR == institution.VU_IDENTIFIKATOR).length,
                                        employees: employees.filter(employee => employee.VU_IDENTIFIKATOR == institution.VU_IDENTIFIKATOR)
                                            .map(employee => {
                                                return {
                                                    id: employee.ZAP_REDNI_BROJ,
                                                    surname: employee.ZAP_PREZIME,
                                                    name: employee.ZAP_IME
                                                }
                                            }),
                                        number_of_courses: courses.filter(course => course.VU_IDENTIFIKATOR == institution.VU_IDENTIFIKATOR).length,
                                        courses: courses.filter(course => course.VU_IDENTIFIKATOR == institution.VU_IDENTIFIKATOR)
                                            .map(course => {
                                                return {
                                                    code: course.NP_PREDMET,
                                                    version: course.NP_VERZIJA,
                                                    name: course.NP_NAZIV_PREDMETA
                                                }
                                            })
                                    }
                                })
                        }
                    })

                    // institutions = institutions.map(institution => {
                    //     return {
                    //         id: institution.VU_IDENTIFIKATOR,
                    //         name: institution.VU_NAZIV,
                    //         number_of_employees: employees.filter(employee => employee.VU_IDENTIFIKATOR == institution.VU_IDENTIFIKATOR).length,
                    //         employees: employees.filter(employee => employee.VU_IDENTIFIKATOR == institution.VU_IDENTIFIKATOR)
                    //             .map(employee => {
                    //                 return {
                    //                     id: employee.ZAP_REDNI_BROJ,
                    //                     surname: employee.ZAP_PREZIME,
                    //                     name: employee.ZAP_IME
                    //                 }
                    //             }),
                    //         number_of_courses: courses.filter(course => course.VU_IDENTIFIKATOR == institution.VU_IDENTIFIKATOR).length,
                    //         courses: courses.filter(course => course.VU_IDENTIFIKATOR == institution.VU_IDENTIFIKATOR)
                    //             .map(course => {
                    //                 return {
                    //                     code: course.NP_PREDMET,
                    //                     version: course.NP_VERZIJA,
                    //                     name: course.NP_NAZIV_PREDMETA
                    //                 }
                    //             })
                    //     }
                    // });

                    if (institutionDocument.length == 0) {
                        reject('No institutions!');
                    }

                    resolve({
                        created_at: JSON.stringify(new Date()),
                        numberOfInstitutions: institutionDocument.length,
                        institutions: institutionDocument
                    });
                });
            })
            .catch((err) => {
                res.render('message', {
                    errorMessage: 'ERROR: ' + err,
                    link: '<a href="/getAllInstitutions"> Go Back</a>'
                });
            })
            .then((institutionDocument) => {
                institutionCollection.insertInstitutionDocuments(institutionDocument)
                    .then(() => {
                        res.redirect('institutionsDocuments');
                    });
            });
    });
}
