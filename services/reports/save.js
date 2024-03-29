const request   = require('request');
const sql       = require('mssql');
const path      = require('path');
const snoowrap  = require('snoowrap');
const config    = require(path.join(process.cwd(), 'config'));
const countries = require("i18n-iso-countries");

sql.on('error', err => {
    console.error("sql error: " + err);
});

async function connectDB() {
    // TODO: implement pooling... will probably get Connection Closed errors for more than 2 concurrent INSERT attempts
    const dbConfig = {
        user: config.DB.USER,
        password: config.DB.PASSWORD,
        server: config.DB.SERVER,
        database: config.DB.DB_NAME,
        options: {
            encrypt: true
        }
    }
    await sql.connect(dbConfig);
}

// Save trip report
// TODO: add proper error handling
async function saveTripReport(req, res, next) {
    var report = req.body;
    await connectDB();

    // Get what3words data TODO: put it its own function
    var w3wUrl = `https://api.what3words.com/v3/convert-to-3wa?coordinates=${report.latitude},${report.longitude}&key=${config.W3W_API_KEY}`;
    request(w3wUrl,
        function (w3wError, w3wResult, w3wBodyJSON) {
            if (w3wError) {
                console.error("Error getting what 3 words response: " + w3wError);
                res.write(JSON.stringify({status: w3wError}));
                res.end();
                return;
            }
            var w3wBody = JSON.parse(w3wBodyJSON);
            var country = countries.getName(w3wBody.country, "en");

            // Dirty SQL safety
            var sqlSafeIntentSet;
            if (report.intent_set) {
                sqlSafeIntentSet = report.intent_set.replace("'", "''");
            }
            var sqlSafeReportText;
            if (report.text) {
                sqlSafeReportText = report.text.replace("'", "''");
            }

            // TODO: uncomment commented out fields when the app supports report them one day. center... just couldnt figure how how to do it with this node module
            var insertQuery = `INSERT INTO ${config.DB.REPORTS_TABLE} (`;
            // insertQuery += "id,"; Automatically incremented from the CREATE TABLE... id uniqueidentifier default NEWSEQUENTIALID() primary key command
            insertQuery += "user_id,";
            insertQuery += "platform,";
            insertQuery += "datetime,";
            insertQuery += "visited,";
            insertQuery += "point_type,";
            insertQuery += "intent_set,";
            insertQuery += "artifact_collected,";
            insertQuery += "fucking_amazing,";
            insertQuery += "rating_meaningfulness,";
            insertQuery += "rating_emotional,";
            insertQuery += "rating_importance,";
            insertQuery += "rating_strangeness,";
            insertQuery += "rating_synchroncity,";
            insertQuery += "text,";
            // insertQuery += "photos,";
            // insertQuery += "intent_suggestions,";
            // insertQuery += "time_intent_suggestions_set,";
            insertQuery += "what_3_words,";
            insertQuery += "nearest_place,";
            insertQuery += "country,";
            insertQuery += "short_hash_id,";
            // insertQuery += "num_water_points_skipped,";
            insertQuery += "gid,";
            insertQuery += "tid,";
            insertQuery += "lid,";
            insertQuery += "type,";
            insertQuery += "x,";
            insertQuery += "y,";
            // insertQuery += "center,";
            insertQuery += "latitude,";
            insertQuery += "longitude,";
            insertQuery += "distance,";
            insertQuery += "initial_bearing,";
            insertQuery += "final_bearing,";
            insertQuery += "side,";
            insertQuery += "distance_err,";
            insertQuery += "radiusM,";
            insertQuery += "number_points,";
            insertQuery += "mean,";
            insertQuery += "rarity,";
            insertQuery += "power_old,";
            insertQuery += "power,";
            insertQuery += "z_score,";
            insertQuery += "probability_single,";
            insertQuery += "integral_score,";
            insertQuery += "significance,";
            insertQuery += "probability";
            insertQuery += ") OUTPUT Inserted.id VALUES (";
            insertQuery += `'${report.user_id}',`; // userid - 64 char hex string of sha256 hash string of their platform's user ID
            insertQuery += `'${report.platform}',`; // platform - int (representing the enum) starting from 0
                                                    // emulator     - 0
                                                    // directline   - 1
                                                    // facebook     - 2
                                                    // telegram     - 3
                                                    // line         - 4
                                                    // discord      - 5
                                                    // slack        - 6
                                                    // skype        - 7
                                                    // randonautica_android - 8
                                                    // randonautica_ios     - 9
            insertQuery += `'${report.datetime}',`; // datetime - date/time of report in UTC timezone / ISO-8601 format, eg. 2019-11-02 12:56:19
            insertQuery += `'1',`; // visited: int (0 if not visited, but we can assume calls to this API mean they visited it)
            insertQuery += `'${report.point_type}',`;   // point_type - string, possible values:
                                                        // Attractor
                                                        // Void
                                                        // Anomaly
                                                        // PairAttractor
                                                        // PairVoid
                                                        // ScanAttractor
                                                        // ScanVoid
                                                        // ScanAnomaly
                                                        // ScanPair
                                                        // Quantum
                                                        // QuantumTime
                                                        // Pseudo
                                                        // MysteryPoint
                                                        // ChainAttractor
                                                        // ChainVoid
                                                        // ChainAnomaly
                                                        // ChainQuantum
                                                        // ChainPseudo
            insertQuery += `'${sqlSafeIntentSet}',`; // intent_set - string of any intentions they set, not supported by app yet
            insertQuery += `'${report.artifact_collected}',`; // artifact_collected: int; 1 - yes, 0 - no
            insertQuery += `'${report.fucking_amazing}',`; // fucking_amazing: int; 1 - yes, 0 - no
            insertQuery += `'${report.rating_meaningfulness}',`; // rating_meaningfulness: string
            insertQuery += `'${report.rating_emotional}',`; // rating_emotional: string
            insertQuery += `'${report.rating_importance}',`; // rating_importance: string
            insertQuery += `'${report.rating_strangeness}',`; // rating_strangeness: string
            insertQuery += `'${report.rating_synchroncity}',`; // rating_synchroncity: string
            insertQuery += `'${sqlSafeReportText}',`; // text: string (the actual report text they type up)
            // insertQuery += `'${report.photos}',`; // photos: string (comma separated URLs of images, like on imgur)
            // insertQuery += `'${report.intent_suggestions}',`; // intent_suggestions: string, comma separated 
            // insertQuery += `'${report.time_intent_suggestions_set}',`; // time_intent_suggestions_set; follows same format as datetime field
            insertQuery += `'${w3wBody.words}',`; // what_3_words - string; one.two.three words 
            insertQuery += `'${w3wBody.nearestPlace}',`; // nearest_place - string, returned from what-3-words API
            insertQuery += `'${country}',`; // country - string; returned from what-3-words API
            insertQuery += `'${report.short_hash_id}',`; // short_hash_id - string; 8 hex chars of Crc32 hash of user_id and datetime fields concated together
            // insertQuery += `'${report.num_water_points_skipped}',`; // num_water_points_skipped; int - set to 0 if function isn't implemented
            // stuff below is from the libAttract
            insertQuery += `'${report.gid}',`; // gid - string; hex sha256 gid
            insertQuery += `'${report.tid}',`; // tid
            insertQuery += `'${report.lid}',`; // lid
            insertQuery += `'${report.type}',`; // type
            insertQuery += `'${report.x}',`; // x
            insertQuery += `'${report.y}',`; // y
            //TODO: SQL error insertQuery += `'geography::Point(${report.latitude},${report.longitude}, 4326)',`; // center - SQL DB native support for a Geographic Point data type
            insertQuery += `'${report.latitude}',`; // latitude
            insertQuery += `'${report.longitude}',`; // longitude
            insertQuery += `'${report.distance}',`; // distance
            insertQuery += `'${report.initial_bearing}',`; // initial_bearing
            insertQuery += `'${report.final_bearing}',`; // final_bearing
            insertQuery += `'${report.side}',`; // side
            insertQuery += `'${report.distance_err}',`; // distance_err
            insertQuery += `'${report.radiusM}',`; // radiusM
            insertQuery += `'${report.n}',`; // number_points
            insertQuery += `'${report.mean}',`; // mean
            insertQuery += `'${report.rarity}',`; // rarity
            insertQuery += `'${report.power_old}',`; // power_old
            insertQuery += `'${report.power}',`; // power
            insertQuery += `'${report.z_score}',`; // z_score
            insertQuery += `'${report.probability_single}',`; // probability_single
            insertQuery += `'${report.integral_score}',`; // integral_score
            insertQuery += `'${report.significance}',`; // significance
            insertQuery += `'${report.probability}'`; // probability
            insertQuery += ");"
            console.log(`INSERT query: ${insertQuery}`)

            // Insert!
            const request = new sql.Request();
            request.query(insertQuery, (insertError, result) => {
                if (insertError) {
                    console.error("Error saving trip report: " + insertError);
                    res.write(JSON.stringify({status: insertError}));
                    res.end();
                    return;
                }

                console.log("Trip report saved: " + result[0].id.toLowerCase());

                // Reddit! TODO: make it its own file/function
                const r = new snoowrap({
                    userAgent: config.REDDIT.USER_AGENT,
                    clientId: config.REDDIT.CLIENT_ID,
                    clientSecret: config.REDDIT.CLIENT_SECRET,
                    refreshToken: config.REDDIT.REFRESH_TOKEN
                });

                var text = "";
                text += `Intention Driven Anomaly found  \n`;
                text += `🦉📱-${report.short_hash_id} (${report.latitude.toFixed(6)},${report.longitude.toFixed(6)})  \n`;
                text += `Type: ${report.point_type}  \n`;
                text += `Radius: ${report.radiusM.toFixed(0)}m  \n`;
                text += `Power: ${report.power.toFixed(2)}  \n`;
                text += `z-score: ${report.z_score.toFixed(2)}  \n`;
                text += `  \n\n`;
                text += `Report: ${report.text}  \n\n`;
                text += `What 3 words address: [${w3wBody.words}](https://what3words.com/${w3wBody.words})  \n`;
                text += `[Google Maps](https://www.google.com/maps/place/${report.latitude}+${report.longitude}/@${report.latitude}+${report.longitude},18z)  |  `;
                text += `[Google Earth](https://earth.google.com/web/search/${report.latitude},${report.longitude})  \n\n`;
                if (report.intent_set && report.intent_set !== '0') text += `Intent set: ${report.intent_set}  \n\n`;
                // text += `Intents suggested: ${report.intent_suggestions}  \n\n`;
                text += `Artifact(s) collected? ${report.artifact_collected === '1' ? 'Yes' : 'No'}  \n`;
                text += `Was a 'wow and astounding' trip?  ${report.fucking_amazing === '1' ? 'Yes' : 'No'}  \n`;
                text += `## Trip Ratings  \n`;
                text += `Meaningfulness: ${report.rating_meaningfulness}  \n`;
                text += `Emotional: ${report.rating_emotional}  \n`;
                text += `Importance: ${report.rating_importance}  \n`;
                text += `Strangeness: ${report.rating_strangeness}  \n`;
                text += `Synchronicity: ${report.rating_synchroncity}  \n`;
                text += `  \n\n`;
                text += `${report.user_id} ${report.short_hash_id} ${report.gid}  \n`;

                var title = `Randonaut Trip Report from ${w3wBody.nearestPlace} (${country})`;
                r.submitSelfpost({
                    subredditName: config.REDDIT.SUBREDDIT,
                    title: title,
                    text: text
                }).then(function (redditResult) {
                    var redditPostId = redditResult.name.replace("t3_", "");
                    
                    var jsonResponse = JSON.stringify({
                        status: 'OK',
                        id: result[0].id.toLowerCase(),
                        nearestPlace: w3wBody.nearestPlace,
                        country: country,
                        what3words: w3wBody.words,
                        redditPostId: redditPostId
                    });

                    console.log(jsonResponse);

                    res.write(jsonResponse);
                    res.end();
                });
            })
        }
    );
}

module.exports = {
    saveTripReport: saveTripReport,
};
