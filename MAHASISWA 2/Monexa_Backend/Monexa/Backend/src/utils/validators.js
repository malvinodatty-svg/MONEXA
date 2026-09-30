// Validasi nominal: angka positif, maksimal 2 desimal, ada batas atas.
const MAX_AMOUNT = 1000000000;

const parseAmount = (value) => {
    if (value === undefined || value === null || value === "") return null;

    const num = Number(value);

    if (!Number.isFinite(num) || num <= 0 || num > MAX_AMOUNT) return null;

    // maksimal 2 angka di belakang koma
    if (Math.round(num * 100) / 100 !== num) return null;

    return num;
};

const isValidEmail = (email) =>
    typeof email === "string" &&
    email.length <= 150 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

module.exports = { parseAmount, isValidEmail, MAX_AMOUNT };
