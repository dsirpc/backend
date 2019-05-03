import express = require('express');
var app = express();

const port = 3000;

app.get('/', (req, res) => res.send('Test'));

app.listen(port, () => console.log(`HTTP app listening on port ${port}!`));