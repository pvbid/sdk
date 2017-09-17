const readline = require("readline");
import PVBidContext from "./PVBidContext";

let bidEngines = [];

const token =
    "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImFmYjlmODIxM2E3OGRlODU2MDkwNzJjMTVjNDU2ZTg2ZjkwNGFiYzM2ZjFmZDAyYTg0N2M5YzI0YThkYjE2YmY4OTk4N2M4MjUxM2MxNDlkIn0.eyJhdWQiOiIyIiwianRpIjoiYWZiOWY4MjEzYTc4ZGU4NTYwOTA3MmMxNWM0NTZlODZmOTA0YWJjMzZmMWZkMDJhODQ3YzljMjRhOGRiMTZiZjg5OTg3YzgyNTEzYzE0OWQiLCJpYXQiOjE1MDQwNDY5NjAsIm5iZiI6MTUwNDA0Njk2MCwiZXhwIjoxNTM1NTgyOTYwLCJzdWIiOiIzIiwic2NvcGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWRlZmluaXRpb25zIiwibWFuYWdlLWJpZHMiLCJzeXN0ZW0tYWRtaW4iXX0.nk3xVSTn340WjMHoaQStSYMAt3jTKa3eHbaC3SDuGlsHFwXZLMZga39I79YQkSepkUESEbKteeGY-0O__unae0nkVyq8ZnBAyGCwhoIEITW2NEs4w3tj8IvCxfY4YrYQEHwbnS0dZsC4y4qJeSbjBrkBpmYIDHeq-DqGLqB3SI1kqPdzB0hmDQUqNdifL9s0l55bvBdKjO55RU42iTnt0T1RzSoBwUZtXtsZUsd2JaGFt_gjv08OW9vd59gSy5GTMzSZ6bgF2Y2tKa8ibXhyQc5Ky-fc595FbznQwDtURaQ15rYNsaoNR4Vhv1kaKgpJu7zse-x_2C8oHC0gIz52jMxFfBfZl_Ns8L-c-Fy25McaUETQnxNagScW6NwVWmJxT5dlcbj4vgcYGRpjeTZvuF2kdQwU9Tw9_ndXYV_sQcyLGErWXzYyE8CH_NWZo-WPQwawealNDj5tgLX9urPmiER-6-bMiijE9SuJFm1wND3DqRM63649E1Ue-yFIYGGT6Hz50Aq893K6SMoj8-FXB252P87-KtViv0XdzimI0R_KOolQ6Wj3v_-7XjxyjnvI6yTik8UQVCkOAfM76nQ7fyhfq7of4VRJHW_8t08JutNNYS5mpifxvXdaOa7bukHke8r1HvVL-YD5JVtm5RPmSv4gBwakKI0KaC51L6uTtIc";

const pvbid = new PVBidContext({ token: token, base_uri: "http://api.pvbid.local/v2" });
let project = null;
function loadBidEngines() {
    pvbid
        .getProject(3)
        .then(p => (project = p))
        .catch(err => console.log(err));
}

loadBidEngines();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on("line", (data, args) => {
    switch (data) {
        case "assess":
            bidEngines[0].assess();

            break;
        case "close":
            rl.close();
            break;
        case "compare":
            for (let li of Object.values(bidEngine.bid.entities.components())) {
                // li.compare();

                let compared = li.compare();

                if (compared.price != 0 || compared.cost != 0) {
                    console.log("compared", li.id, li.cost, compared);
                }
            }
            break;
        default:
            if (data.indexOf("print") >= 0) {
                let split = data.split(" ");
                print(split[1], split[2]);
            } else {
                console.log("Command not available.");
            }
            break;
    }
});

function print(type, id) {
    if (type === "bid") {
        console.log(bidEngine.bid);
    } else {
        let item = Object.assign({}, bidEngine.bid[type](id));
        delete item.bid;
        console.log(item);
        console.log(item.config);
    }
}
