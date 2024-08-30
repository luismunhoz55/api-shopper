import express, { Express, Request, Response } from "express";
import router from "./routes/routes";
import "./services/deleteImages";
import path from "path";

const app: Express = express();
const port = 5000;

// Handle json in url requests
app.use(express.json());

app.use("/static", express.static(path.join(__dirname, "images")));

// test if it's working
app.get("/", (req: Request, res: Response) => {
  res.send("api-shopper! 🐱‍🐉");
});

// Register the routes
app.use("/", router);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
