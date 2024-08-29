import express, { Express, Request, Response } from "express";
import router from "./routes/routes";

const app: Express = express();
const port = 5000;

// Handle json in url requests
app.use(express.json());

// test if it's working
app.get("/", (req: Request, res: Response) => {
  res.send("api-shopper! 🐱‍🐉");
});

// Register the routes
app.use("/", router);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
