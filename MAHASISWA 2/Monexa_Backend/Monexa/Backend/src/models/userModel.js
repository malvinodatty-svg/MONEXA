// Model / Query Helper untuk Entitas User
const pool = require("../config/database");

const findByEmail = async (email) => {
    const [rows] = await pool.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
    );
    return rows[0] || null;
};

const createUser = async (connection, { name, email, hashedPassword, role = "user" }) => {
    const [result] = await connection.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role]
    );
    return result.insertId;
};

module.exports = {
    findByEmail,
    createUser
};
