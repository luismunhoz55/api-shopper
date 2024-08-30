import cron from "node-cron";
import fs from "fs";
import path from "path";

const IMAGE_LIFETIME_MS = 10 * 60 * 1000;

cron.schedule("* * * * *", () => {
  const directory = path.join(__dirname, "../images");

  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      fs.stat(filePath, (err, stats) => {
        if (err) throw err;

        const now = Date.now();
        const fileAge = now - stats.mtimeMs;

        if (fileAge > IMAGE_LIFETIME_MS) {
          fs.unlink(filePath, (err) => {
            if (err) throw err;
          });
        }
      });
    });
  });
});
