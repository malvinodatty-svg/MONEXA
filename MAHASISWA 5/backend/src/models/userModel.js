// Model / Query Helper untuk Entitas User
const pool = require("../config/database");

const findByEmail = async (email) => {
    const [rows] = await pool.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
    );
    return rows[0] || null;
};

const createUser = async (connection, { id, name, email, hashedPassword, phone = null, role = "USER" }) => {
    await connection.execute(
        "INSERT INTO users (id, name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
        [id, name, email, hashedPassword, phone, role]
    );
    return id;
};

module.exports = {
    findByEmail,
    createUser
};
