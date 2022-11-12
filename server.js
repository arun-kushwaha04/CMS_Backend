//Dependencies
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
require("./global");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoConnection = require("./mongoDBConnection");

try {
    const port = process.env.PORT || 8000;
    const app = express();

    //Middlewares
    app.use(cookieParser(global.cookieSecret));
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    //mongoDB connection
    mongoConnection()
        .then((mongoDefaultConnection) => {
            console.log(
                global.color.green,
                "Successfully connected to mongoDB server",
                global.color.reset
            );
            global.mongoDefaultConnection = mongoDefaultConnection;
        })
        .catch(() => {
            console.error(
                global.color.red,
                "Failed to connect mongoDB server",
                global.color.reset
            );
            console.log(
                global.color.yellow,
                "Stopping the server...",
                global.color.reset
            );
            process.exit(0);
        });

    //checkauthorization middleware
    app.use("/api", require("./routes/authorization"));

    //api endpoints
    require("./routes/index.js")(app);

    //serve static assets when in production
    if (process.env.NODE_ENV === "production") {
        app.use(express.static("frontend/build"));
        app.get("*", (req, res) => {
            res.sendFile(
                path.resolve(__dirname, "frontend", "build", "index.html")
            );
        });
    }

    app.listen(port, () => {
        console.log(`Server is listening to port: ${port}`);
    });
} catch (error) {
    console.error(error);
    console.log(
        global.color.yellow,
        "Stopping the server...",
        global.color.reset
    );
    process.exit(0);
}
