//Dependencies
const mysql = require('mysql');
const inquirer = require('inquirer');
const figlet = require('figlet');
const cTable = require('console.table');

const connection = mysql.createConnection({
    //your host
    host: 'localhost',
    // Your port; if not 3306
    port: 3306,
    // Your username
    user: 'root',
    // Be sure to update with your own MySQL password!
    password: 'root',
    // database name
    database: 'company_db',
    //allow for multiple statements
    multipleStatements: true
});



//Figlet to create app banner
console.log(figlet.textSync('Employee\n\nTracker\n', {
    font: 'banner4',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 80,
    whitespaceBreak: true
}));

//Functions
//View All Employees
const empAll = () => {
    let query = 'SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.name as "department", roles.salary, CONCAT(managers.first_name, " ", managers.last_name) AS "manager"'
    query += 'FROM employees LEFT JOIN roles ON employees.role_id = roles.id ';
    query += 'LEFT JOIN departments ON roles.department_id = departments.id ';
    query += 'LEFT JOIN employees managers ON employees.manager_id = managers.id';
    connection.query(query, (err, res) => {
        if (err) throw err;
        console.log("\nAll Employees\n");
        console.table(res);
        appMenu();
    });
}

// View all employees by department
const empAllDept = () => {
    const query = 'SELECT * FROM departments'
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'list',
                message: 'Choose a Department',
                name: 'department',
                choices: res.map(res => ({
                    value: res.name
                }))

            }
        ]).then((response) => {
            let query = 'SELECT employees.id, employees.first_name, employees.last_name, roles.title FROM departments ';
            query += 'LEFT JOIN roles ON roles.department_id = departments.id ';
            query += ' LEFT JOIN employees ON employees.role_id = roles.id WHERE ?';
            connection.query(query, { name: response.department }, (err, res) => {
                if (res[0].id !== null) {
                    console.log(`\nAll Employees in ${response.department}\n`);
                    console.table(res);
                } else {
                    console.log(`\nWe need to hire people for the ${response.department} Department\n`)
                }
                appMenu();
            });
        });
    });
}

// View all employees by manager
const empAllMgr = () => {
    const query = 'SELECT id, CONCAT(first_name, " " , last_name) AS "Manager" FROM employees WHERE id in (SELECT DISTINCT manager_id FROM employees)'
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'list',
                message: 'Choose a Manager',
                name: 'Manager',
                choices: res.map(res => ({
                    name: res.Manager,
                    value: res.id
                }))

            }
        ]).then((response) => {
            console.log(response)
            let query = 'SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.name as "department"'
            query += 'FROM employees LEFT JOIN roles ON employees.role_id = roles.id ';
            query += 'LEFT JOIN departments ON roles.department_id = departments.id WHERE ?';
            connection.query(query, { manager_id: response.Manager }, (err, res) => {
                console.log(`\nAll Employees that report to ${response.Manager}\n`);
                console.table(res);
                appMenu();
            });
        });
    });
}

// Add an employee
const addEmp = () => {
    const roleQuery = 'SELECT * FROM roles; SELECT id, first_name, last_name FROM employees union select null, "NONE", "" ORDER BY id';
    connection.query(roleQuery, (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'input',
                message: 'What is the Employee\'s First Name?',
                name: 'first_name'
            },
            {
                type: 'input',
                message: 'What is the Employee\'s Last Name?',
                name: 'last_name'
            },
            {
                type: 'list',
                message: (response) => `Choose ${response.first_name}'s Role`,
                name: 'role_id',
                choices: res[0].map(res => ({
                    name: res.title,
                    value: res.id
                }))
            },
            {
                type: 'list',
                message: (response) => `Choose ${response.first_name}'s Manager`,
                name: 'manager_id',
                choices: res[1].map(res => ({
                    name: res.first_name + ' ' + res.last_name,
                    value: res.id,
                    default: 'None'
                }))
            }
        ]).then((response) => {
            const query = connection.query(
                'INSERT INTO employees SET ?',
                {
                    first_name: response.first_name,
                    last_name: response.last_name,
                    role_id: response.role_id,
                    manager_id: response.manager_id
                },
                (err, res) => {
                    if (err) throw err;
                    console.log(`\nEmployee ID:${res.insertId} has been added\n`);
                    appMenu();
                }
            );
        });
    });
};

//Delete Employee
const delEmp = () => {
    const query = 'SELECT * FROM employees'
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'list',
                message: 'Choose an Employee to remove',
                name: 'employee',
                choices: res.map(res => ({
                    name: res.first_name + ' ' + res.last_name,
                    value: res.id
                }))
            }
        ]).then((response) => {
            connection.query(
                'DELETE FROM employees WHERE ?',
                {
                    id: response.employee,
                },
                (err, res) => {
                    if (err) throw err;
                    console.log(`\nEmployee #${response.employee} has been removed!\n`);
                    appMenu();
                }
            );

        });
    });
}


//Give Employee New Role
const newEmpRole = () => {
    const roleQuery = 'SELECT id, first_name, last_name FROM employees;SELECT * FROM roles ORDER BY title';
    connection.query(roleQuery, (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'list',
                message: 'Choose the Employee whose role is changing',
                name: 'id',
                choices: res[0].map(res => ({
                    name: res.first_name + ' ' + res.last_name,
                    value: res.id
                }))
            },
            {
                type: 'list',
                message: `Choose a new Role`,
                name: 'role_id',
                choices: res[1].map(res => ({
                    name: res.title,
                    value: res.id
                }))
            }
        ]).then((response) => {
            const query = connection.query(
                'UPDATE employees SET ? WHERE ?', [
                {
                    role_id: response.role_id,
                },
                {
                    id: response.id
                },
            ],
                (err, res) => {
                    if (err) throw err;
                    console.log(`\nEmployee ID:${response.id} has been updated\n`);
                    appMenu();
                }
            );
        });
    });
}

//Give Employee New Manager
const newEmpMgr = () => {
    const mgrQuery = 'SELECT id, first_name, last_name FROM employees';
    connection.query(mgrQuery, (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'list',
                message: 'Choose the Employee whose Manager is changing',
                name: 'id',
                choices: res.map(res => ({
                    name: res.first_name + ' ' + res.last_name,
                    value: res.id
                }))
            }
        ]).then((response) => {
            let empId = response.id
            let mgrQuery = `SELECT id, first_name, last_name FROM employees WHERE id !=${empId}`;
            connection.query(mgrQuery, (err, res) => {
                console.log(res);
                console.log(empId);
                inquirer.prompt([
                    {
                        type: 'list',
                        message: 'Choose a new Manager',
                        name: 'manager_id',
                        choices: res.map(res => ({
                            name: res.first_name + ' ' + res.last_name,
                            value: res.id
                        }))
                    }
                ]).then((response) => {
                    console.log(empId);
                    console.log(response);
                    const query = connection.query(
                        'UPDATE employees SET ? WHERE ?', [
                        {
                            manager_id: response.manager_id,
                        },
                        {
                            id: empId
                        },
                    ],
                        (err, res) => {
                            if (err) throw err;
                            console.log(`\nEmployee ID:${empId} now reports to Manager ID: ${response.manager_id}\n`);
                            appMenu();
                        }
                    );
                });
            });
        });
    });
}

//View all roles
const roleAll = () => {
    const query = 'SELECT * FROM roles';
    connection.query(query, (err, res) => {
        if (err) throw err;
        console.log("\nAll Roles\n");
        console.table(res);
        appMenu();
    });
}

//Add a role
const addRole = () => {
    const query = 'SELECT * FROM departments'
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'input',
                message: 'What is the title of Role being added?',
                name: 'title'
            },
            {
                type: 'input',
                message: 'What is the salary of Role being added?',
                name: 'salary'
            },
            {
                type: 'list',
                message: 'What Department should this Role be added to',
                name: 'department_id',
                choices: res.map(res => ({
                    name: res.name,
                    value: res.id
                }))

            }

        ]).then((response) => {
            const query = connection.query(
                'INSERT INTO roles SET ?',
                {
                    title: response.title,
                    salary: response.salary,
                    department_id: response.department_id
                }, (err, res) => {
                    if (err) throw err;
                    console.log(`\n${response.title} Role added!\n`);
                    appMenu();
                }
            );
        })
    });
}


//Delete a role
const delRole = () => {
    const query = 'SELECT * FROM roles';
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'list',
                message: `What Role do you want to remove?`,
                name: 'id',
                choices: res.map(res => ({
                    name: res.title,
                    value: res.id
                }))
            }
        ]).then((response) => {
            console.log(response)
            const query = connection.query(
                'DELETE FROM roles WHERE ?', [
                {
                    id: response.id,
                }
            ],
                (err, res) => {
                    if (err) throw err;
                    console.log(`\nRole ID:${response.id} has been removed\n`);
                    appMenu();
                }
            );
        });
    });
}

//View all departments
const deptAll = () => {
    const query = 'SELECT * FROM departments';
    connection.query(query, (err, res) => {
        if (err) throw err;
        console.log("\nAll Departments\n");
        console.table(res);
        appMenu();
    });
}

//View  departments Budget
const deptBudget = () => {
    const query = 'SELECT * FROM departments'
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'list',
                message: 'Choose a Department',
                choices() {
                    const choiceArray = [];
                    res.forEach(({ name }) => {
                        choiceArray.push(name);
                    });
                    return choiceArray;
                },
                name: 'department'
            }
        ]).then((response) => {
            let query = 'SELECT departments.id, SUM(roles.salary) AS "Total Budget" FROM departments ';
            query += 'LEFT JOIN roles ON roles.department_id = departments.id ';
            query += ' LEFT JOIN employees ON employees.role_id = roles.id WHERE ?';
            connection.query(query, { name: response.department }, (err, res) => {
                if (res[0].id !== null) {
                    console.log(`\nTotal Utilized Budget for ${response.department}\n`);
                    console.table(res);
                } else {
                    console.log(`\nNo Utilized Budget for the ${response.department} Department`)
                }
                appMenu();
            });
        });
    });
}

//Add  department
const addDept = () => {
    inquirer.prompt([
        {
            type: 'input',
            message: 'What is the name of the Department being added?',
            name: 'name'
        }
    ]).then((response) => {
        const query = connection.query(
            'INSERT INTO departments SET ?',
            {
                name: response.name
            }, (err, res) => {
                if (err) throw err;
                console.log(`\n${response.name} Department added!\n`);
                appMenu();
            }
        );
    })
}

//Remove  department
const delDept = () => {
    const query = 'SELECT * FROM departments';
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'list',
                message: `What Department do you want to remove?`,
                name: 'id',
                choices: res.map(res => ({
                    name: res.name,
                    value: res.id
                }))
            }
        ]).then((response) => {
            console.log(response)
            const query = connection.query(
                'DELETE FROM departments WHERE ?', [
                {
                    id: response.id,
                }
            ],
                (err, res) => {
                    if (err) throw err;
                    console.log(`\nDepartment ID:${response.id} has been removed\n`);
                    appMenu();
                }
            );
        });
    });
}

// Menu Function
const appMenu = () => {
    inquirer.prompt([
        {
            type: 'list',
            message: 'What would you like to do?',
            choices: [
                'View All Employees',
                new inquirer.Separator(),
                'View All Employees By Department',
                new inquirer.Separator(),
                'View All Employees By Manager',
                new inquirer.Separator(),
                'Add Employee',
                new inquirer.Separator(),
                'Remove Employee',
                new inquirer.Separator(),
                'Update Employee Role',
                new inquirer.Separator(),
                'Update Employee Manager',
                new inquirer.Separator(),
                'View All Roles',
                new inquirer.Separator(),
                'Add Role',
                new inquirer.Separator(),
                'Remove Role',
                new inquirer.Separator(),
                'View All Departments',
                new inquirer.Separator(),
                'View Department Budget',
                new inquirer.Separator(),
                'Add Department',
                new inquirer.Separator(),
                'Remove Department',
                new inquirer.Separator(),
                'Quit',
                new inquirer.Separator(),
            ],
            name: 'menu'
        }
    ]).then((response) => {
        switch (response.menu) {
            case 'View All Employees':
                empAll();
                break;
            case 'View All Employees By Department':
                empAllDept();
                break;
            case 'View All Employees By Manager':
                empAllMgr();
                break;
            case 'Add Employee':
                addEmp();
                break;
            case 'Remove Employee':
                delEmp();
                break;
            case 'Update Employee Role':
                newEmpRole();
                break;
            case 'Update Employee Manager':
                newEmpMgr();
                break;
            case 'View All Roles':
                roleAll();
                break;
            case 'Add Role':
                addRole();
                break;
            case 'Remove Role':
                delRole();
                break;
            case 'View All Departments':
                deptAll();
                break;
            case 'View Department Budget':
                deptBudget();
                break;
            case 'Add Department':
                addDept();
                break;
            case 'Remove Department':
                delDept();
                break;
            case 'Quit':
                console.log("Goodbye!");
                connection.end();
                break;
            default:
                console.log("Goodbye!");
                connection.end();
                break;
        }
    })
}

//Launch Menu
connection.connect((err) => {
    if (err) throw err;
    console.log(`\nconnected as id ${connection.threadId}\n`);
    appMenu();
});