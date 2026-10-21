const app = require("./app");
const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
  console.log(`tareas-api escuchando en el puerto ${puerto}`);
});
