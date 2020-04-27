const version = 'v5';
const osrmTextInstructions = require('osrm-text-instructions')(version);

const https = require('https')

let MapboxAPI = "https://api.mapbox.com";
let directionsURL = "/directions/v5/mapbox/"
let optionURL = ['walking/', 'driving/', 'biking/'];
let mapboxkey = "pk.eyJ1IjoiZGF2aWRmYWxjb24iLCJhIjoiY2s1djR3Mnh2MHNuOTNkbDdob29hZ3VxaSJ9.qfVyLqiQ3TiqGtvdEBZp0g";

//Used to get the current version of libAttract
exports.getRouteInstructions = (req, res) => {
  console.log("reac")
  //TODO ADD ERROR HANDLING AND CHECKS!!

  let setLocation = [req.params.from1, req.params.from2];
  let attractorLocation = [req.params.to1, req.params.to2];

  https.get(MapboxAPI + directionsURL + optionURL[0] + setLocation[0] + "," + setLocation[1] + ';' + attractorLocation[0] + "," + attractorLocation[1] + 
    '?access_token=' + mapboxkey + '&alternatives=true&geometries=polyline6&overview=full&steps=true&bearings=;&continue_straight=true&annotations=congestion,distance&language=en&roundabout_exits=true&voice_instructions=true&banner_instructions=true&voice_units=imperial&enable_refresh=true', (resp) => {
    
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      let response = JSON.parse(data);

      //Steps length
      let StepsLength = response.routes[0].legs[0].steps.length;

      //For storing instructions
      let instructions = [];

      //Get Instructions for each leg
      response.routes[0].legs.forEach(function(leg) {
        leg.steps.forEach(function(step) {    

          //Create instruction object
          let routeInstructionObject = {
              'instruction': step.maneuver.instruction, //Instruction
              'distance': step.distance, //Distance in meters
              'voiceInstructions': step.voiceInstructions ? step.voiceInstructions : [] //Voice instruction
          };

          //Store instruction
          instructions.push(routeInstructionObject);
          
        });      
      }); //End Legs loop

      res.writeHead(200, {'content-Type': 'application/json'});
      res.end(JSON.stringify(instructions));

    });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
      
}

//Used to get navigation locally (WIP)
exports.getRouteNavigationsLocal = (req, res) => {
  
  let setLocation = [req.params.from1, req.params.from2];
  let attractorLocation = [req.params.to1, req.params.to2];

  http.get('http://127.0.0.1:5000/route/v1/foot/'+setLocation[0] + "," + setLocation[1] + ';' + attractorLocation[0] + "," + attractorLocation[1] + 
    '?steps=true&geometries=polyline6&alternatives=true&geometries=polyline6&overview=full&steps=true&bearings=;&continue_straight=true&annotations=distance', (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      let response = JSON.parse(data);

      //Change this!
      response.uuid = "nb_t2QFUlOP1Ycrepb7yq2AEbegPjD81hnXzegGttFEbpyb5eCW7cw=="
      response.routes[0].weight = 310.5;
      response.routes[0].duration = 310.5;
      response.routes[0].voiceLocale = "en-US";
      response.routes[0].weight_name = "routability";

      //Steps length
      let StepsLength = response.routes[0].legs[0].steps.length;

      //For storing instructions
      let instructions = [];

      //Get Instructions for each leg
      response.routes[0].legs.forEach(function(leg) {
        leg.steps.forEach(function(step) {    

          for(let i = 0; i < step.intersections.length; i++){
              step.intersections[i].geometry_index = 1; 
          }

          //Get Instruction from JSON
          let instruction = osrmTextInstructions.compile('en', step, (response.routes[0].legs.length, 0, 0, 0))
         
          //Set Instruction
          step.maneuver.instruction = instruction;

          //Store instruction
          instructions.push(instruction);
          
        });      
      }) //End Legs loop

      
      //Set Voice Instructions
      let voiceInstructions = [];
          

      response.routes[0].legs[0].steps[0].bannerInstructions = [
          {
          "distanceAlongGeometry": response.routes[0].legs[0].steps[0].distance,
          "primary": {
          "text": response.routes[0].legs[0].steps[0].name,
          "components": [ {
              "text": instructions[0],
              "type": "text"
          } ],
          "type": "turn",
          "modifier": "right"
          },
          "secondary": null,
          // "then": "mvo"
          }
      ];

      for(let x = 0; x < StepsLength-1; x ++) {
        response.routes[0].legs[0].steps[x].voiceInstructions = [];
        response.routes[0].legs[0].steps[x].bannerInstructions = [];

        response.routes[0].legs[0].steps[x].bannerInstructions = [
                {
                  "distanceAlongGeometry": response.routes[0].legs[0].steps[x].distance,
                  "primary": {
                    "text": "test",//((response.routes[0].legs[0].steps[x].name) ? response.routes[0].legs[0].steps[x].name : response.routes[0].legs[0].steps[x-1].bannerInstructions[0].primary.text),
                    "components": [ {
                                                "text": instructions[x+1],
                                                "type": "text"
                      } ],
                    "type": "turn",
                    "modifier": "right"
                  },
                  "secondary": null,
                 // "then": "mvo"
                }
              ];
          // instructions[].push = instruction;
         for(let i = 0; i < 3; i ++) {
            switch(i){
              case 0:
                 response.routes[0].legs[0].steps[x].voiceInstructions.push(
                  {
                    "distanceAlongGeometry": response.routes[0].legs[0].steps[x].distance, //Don't know how this is calculated 
                    "announcement": instructions[x],
                    "ssmlAnnouncement": "<speak><amazon:effect name=\"drc\"><prosody rate=\"1.08\">" + instructions[i] + "</prosody></amazon:effect></speak>"
                  });
                  break;
              case 1:
                  response.routes[0].legs[0].steps[x].voiceInstructions.push(
                  {
                    "distanceAlongGeometry": response.routes[0].legs[0].steps[x].distance,
                    "announcement": "In " + response.routes[0].legs[0].steps[x].distance + " meter, " + instructions[x+1],
                    "ssmlAnnouncement": "<speak><amazon:effect name=\"drc\"><prosody rate=\"1.08\">" + "In "  + response.routes[0].legs[0].steps[x].distance + " meter, " + "then " + instructions[x+1] + "</prosody></amazon:effect></speak>"
                  });
                  break;
              case 2:
                  response.routes[0].legs[0].steps[x].voiceInstructions.push(
                  {
                    "distanceAlongGeometry": response.routes[0].legs[0].steps[x].distance,
                    "announcement": instructions[x+1],
                    "ssmlAnnouncement": "<speak><amazon:effect name=\"drc\"><prosody rate=\"1.08\">" + instructions[x+1] + "</prosody></amazon:effect></speak>"
                  });
                  break;
              default:
                  console.log('Sorry, we are out of ' + expr + '.');
            }
           
          } //End Second loop
        } //End first loop


        let modifier = "";

        //First banner
        response.routes[0].legs[0].steps[0].bannerInstructions = [
              {
                "distanceAlongGeometry":  response.routes[0].legs[0].steps[0].distance,
                "primary": {
                  "text": response.routes[0].legs[0].steps[0].name,
                  "components": [ {
                      "text": instructions[0],
                      "type": "text"
                  } ],
                  "type": "turn",
                  "modifier": "straight"
                },
                "secondary": null,
                 // "then": "mvo"
              }
        ];

        response.routes[0].legs[0].steps[StepsLength-1].voiceInstructions = [];
        response.routes[0].legs[0].steps[StepsLength-1].bannerInstructions = [];

        res.writeHead(200, {'content-Type': 'application/json'});
        res.end(JSON.stringify(response));

    });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
      
}

//Used to get route instructions locally (WIP)
exports.getRouteInstructionsLocal = (req, res) => {
  
  let setLocation = [req.params.from1, req.params.from2];
  let attractorLocation = [req.params.to1, req.params.to2];
  let localhost = "127.0.0.1:5000";

  http.get('http://' + localhost + '/route/v1/foot/' + setLocation[0] + "," + setLocation[1] + ';' + attractorLocation[0] + "," + attractorLocation[1] + 
    '?steps=true&geometries=polyline6&alternatives=true&geometries=polyline6&overview=full&steps=true&bearings=;&continue_straight=true&annotations=distance', (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      let response = JSON.parse(data);

      //Steps length
      let StepsLength = response.routes[0].legs[0].steps.length;

      //For storing instructions
      let instructions = [];

      //Get Instructions for each leg
      response.routes[0].legs.forEach(function(leg) {
        leg.steps.forEach(function(step) {    

          //Get Instruction from JSON
          let instruction = osrmTextInstructions.compile('en', step, (response.routes[0].legs.length, 0, 0, 0))

          //Create instruction object
          let routeInstructionObject = {
              instruction: instruction,
              distance: step.distance
          };

          //Store instruction
          instructions.push(routeInstructionObject);

          
        });      
      }); //End Legs loop

      console.log(instructions);

      res.writeHead(200, {'content-Type': 'application/json'});
      res.end(JSON.stringify(instructions));

    });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
      
}