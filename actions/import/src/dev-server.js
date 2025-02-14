const express = require('express');
const bodyParser = require('body-parser');
const { main } = require('./index.js');

const app = express();
app.use(bodyParser.json());

app.post('/', async (req, res) => {
  try {
    const base64Body = Buffer.from(JSON.stringify(req.body)).toString('base64');

    const params = {
      __ow_method: 'post',
      __ow_body: base64Body,
    };

    if (req.headers.authorization) {
      params.authorization = req.headers.authorization;
    }

    const result = await main(params);
    return res.status(result.statusCode).json(result.body);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    return res.status(500).json({ message: 'Local server error', error: err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Local dev server running at http://localhost:${PORT}`); // eslint-disable-line no-console
});
