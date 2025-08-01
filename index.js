require('dotenv').config();
const express = require('express');
const cors = require('cors');
const eventsRouter = require('./routes/events');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/events', eventsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en puerto ${PORT}`);
});
