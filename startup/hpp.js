import hpp from "hpp";

export default function (app) {
  app.use(hpp({ checkQuery: true, checkBody: true }));
}
