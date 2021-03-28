INSERT INTO `company_db`.`departments`
(`id`,
`name`)
VALUES
(1001,'Sales'),
(1002,'Engineering'),
(1003,'Customer Success'),
(1004,'Finance'),
(1005,'Legal');

INSERT INTO `company_db`.`roles`
(`id`,
`title`,
`salary`,
`department_id`)
VALUES
(10,'Sales Lead',100000,1001),
(11,'Salesperson',80000,1001),
(12,'Lead Engineer',150000,1002),
(13,'Software Engineer',120000,1002),
(14,'Account Manager',75000,1003),
(15,'Accountant',125000,1004),
(16,'Legal team Lead',250000,1005),
(17,'Lawyer',190000,1005);

INSERT INTO `company_db`.`employees`
(`id`,
`first_name`,
`last_name`,
`role_id`,
`manager_id`)
VALUES
(1,'Dewey','Edwards',10,null),
(2,'Bryant','Knight',11,1),
(3,'Ronald','Sherman',12,null),
(4,'Hugh','Burgess',13,3),
(5,'Mack','Flores',14,null),
(6,'Eula','Phelps',15,null),
(7,'Arnold','Maldonado',16,null),
(8,'Sherri','Vaughn',17,null),
(9,'Nick','Houston',11,1),
(10,'Wendell','Johnson',13,3);