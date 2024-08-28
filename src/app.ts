import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/healthcheck", (req: Request, res: Response) => {
  res.send("api-shopper! 🐱‍🐉");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
