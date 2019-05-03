import express = require('express');
var app = express();

const port = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('Test'));

app.listen(port, () => console.log(`HTTP app listening on port ${port}!`));