import cron from "node-cron";
import fs from "fs";
import path from "path";

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

        // Delete the file if older than 10 minutes
        if (fileAge > 10 * 60 * 1000) {
          fs.unlink(filePath, (err) => {
            if (err) throw err;
          });
        }
      });
    });
  });
});
