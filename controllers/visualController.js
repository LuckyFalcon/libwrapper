'use strict';
const { check, validationResult } = require('express-validator');
const path        = require('path');
const checkAuth   = require(path.join(process.cwd(), "/services/authentication/check-auth.js"));
const { exec } = require("child_process");

// Used to output an image visualizing specified entropy thanks to SteveLib
exports.visualizeEntropy = [
 (req, res, next) => {
    var cmd = "mkdir -p public/" + req.query.gid + "/hex_in; cd public/" + req.query.gid + "; find ../../services/entropy | grep " + req.query.gid + " | xargs cat | jq --raw-output .Entropy > hex_in/entropy.hex; temporal view hex_in/ .; rm hex_in/entropy.hex; rmdir hex_in;";
    console.log("cmd: " + cmd);
    runCmd(cmd);
    res.redirect("/" + req.query.gid + "/external_scoring.html");
  }
];

function runCmd(cmd) {
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            console.log(`stderr: ${stderr}`);
            console.log(`stdout: ${stderr}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            console.log(`stdout: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}
