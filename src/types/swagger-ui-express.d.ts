declare module "swagger-ui-express" {
  import type { RequestHandler } from "express";
  const swaggerUi: {
    serve: RequestHandler[];
    setup: (spec?: object) => RequestHandler;
  };
  export default swaggerUi;
}
