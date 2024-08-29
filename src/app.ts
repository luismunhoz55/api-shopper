import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import router from "./routes/routes";

dotenv.config();

const app: Express = express();
const port = 5000;

app.use(express.json());

// test if it's working
app.get("/", (req: Request, res: Response) => {
  res.send("api-shopper! 🐱‍🐉");
});

app.use("/", router);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
