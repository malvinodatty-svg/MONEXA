// Middleware validasi umum (jika ingin dipisah dari controller)
const validateBody = (validatorFn) => {
    return (req, res, next) => {
        const error = validatorFn(req.body);
        if (error) {
            return res.status(400).json({ message: error });
        }
        next();
    };
};

module.exports = { validateBody };
