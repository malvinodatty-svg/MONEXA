const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server CloudWallet running on port ${PORT}`);
});
