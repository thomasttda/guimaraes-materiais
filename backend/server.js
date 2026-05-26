require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

console.log('Backend rodando em http://localhost:' + PORT);
app.listen(PORT);
