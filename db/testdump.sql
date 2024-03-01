
CREATE TABLE User(
	user_id INT PRIMARY KEY AUTO_INCREMENT,
	username VARCHAR(60),
	passwords VARCHAR(60)
);

INSERT INTO User(username, passwords) VALUES("User1", "12");
INSERT INTO User(username, passwords) VALUES("User2", "12");

ALTER USER 'root' IDENTIFIED WITH mysql_native_password BY 'password';

flush privileges;
