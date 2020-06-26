//the data-file will be saved as a csv data with the name written here:

var n_trials = window.prompt("Type in number of trials: (integer)");
var participants_id = window.prompt("Type in Participants ID: (integer)");

//var growth_factor = 10; //optional value. Pixels to grow vertically.
var growth_factor = (3*window.screen.height - 800)/508.0; //This way, the mean number of inflations is 64 (max 128).
var n_stars_per_point = 200; //Every 200 points, there is a star.
var n_coins_per_point = 8.0; //Every 8 temporary points, there is a coin.


// function to download the data at the end of the experiment
function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

//this is the text that will contain the data in csv format:
var datatext = "trial; break_rd; stop_rd; pop_col; rd_points; tot_points; rd_time\n";
//.

var points = 0; //to be found in datatext
var temp_points = 0; //only for the trial and then set to 0.
var pump_val = 1;    // Score value of each pump.

var w = window.screen.width;
var h = window.screen.height;

var pop_sound = new Audio('stimuli/pop.wav');

var trials_gone_through = []; //needed for the recursive trial's if/else conditions

//initializing and randomizing the trials:
var inflation_object = {
    max_rd: null,
    trial: null,
};


for (var i = 0; i < n_trials; i++) {
    var random_max_rd = Math.round(Math.random() *(((3*h)/4 - 200)/growth_factor))+1;
    inflation_object = {
        max_rd: random_max_rd,
        trial: i+1
    }
    trials_gone_through.push(inflation_object.trial);
    trials_gone_through.push(inflation_object.max_rd);

}
inflation_object = null; //setting the object back to null for efficiency.
// At this point, we have the array trials_gone_through with a value like [1, 50, 2, 23, 3, 100, 4, 49].
var trial_cursor = 0;
var max_rd_cursor = 1;



var timeline = [];

/*
//fullscreen mode:
timeline.push({                           
    type: 'fullscreen',
    fullscreen_mode: true
});
//.
*/

//First three instruction screen:
var instr1 = {
    type: 'html-button-response',
    stimulus: '<p>Du wirst nun nacheinander Luftballons auf dem Bildschirm sehen.</p>' +
    '<p>Mit einem Klick auf die Wolke kannst du jeden Ballon aufpumpen.</p>' +
    '<p>Mit jedem Klick wird sich der Ballon etwas mehr füllen.</p>' +
    '<p><img src="stimuli/pump.png"></img></p>',
    choices: ['Weiter']
};

timeline.push(instr1);
var instr2 = {
    type: 'html-button-response',
    stimulus: "<p>Der Luftballon kann platzen, wenn du ihn zu stark aufpumpst. Manche Luftballons</p>"  +
    "<p>platzen bereits nach wenigen Klicks. Andere platzen erst, wenn sie fast den</p>" +
    "<p>ganzen Bildschirm ausfüllen. Je größer du den Ballon aufpumpst,</p>" + 
    "<p>ohne dass er platzt, umso mehr Punkte bekommst du.</p>" +
    "<p><img src='stimuli/peng.png'></img></p>",
    choices: ['Weiter']
};
timeline.push(instr2);

var instr3 = {
    type: 'html-button-response',
    stimulus: "<p>Mit einem Klick auf die Schatztruhe kannst du die Punkte sammeln und speichern.</p>"  +
    "<p><img src='stimuli/collect.png'></img></p>" +
    "<p>Wenn der Luftballon aber platzt bevor die Punkte sammelst, gehst du leer aus und bekommst</p>" +
    "<p>keine Punkte für diese Runde.</p>" + 
    "<p>Wer am Ende der Studie insgesamt die meisten Punkte erzielt hat, gewinnt ein Tablet.</p>",
    choices: ['Anfangen'],
    on_finish: function() {inactivityTime(); } //Initialize the warning function.
};
timeline.push(instr3);

var button_scale = window.screen.height/1000; //scale attribute of any image object has a value between 0 and 1.


//Trial's visual components:
var background_image_object = {
    obj_type: 'image',
    file: 'stimuli/background.png',
    scale: h/1080
}
var cloud_object = {
    obj_type: 'image',
    file: 'stimuli/pump.png',
    scale: h/1000,
    startX: w/4,
    startY: h*(3/4)
}
var cloud__text_object = {
    obj_type: 'text',
    content: 'Pumpen',
    font: "30px Arial",
    startX: w/4,
    startY: h*(3/4) + h/10 + 10
}
var chest_object = {
    obj_type: 'image',
    file: 'stimuli/collect.png',
    scale: h/1000,
    startX: w*(3/4),
    startY: h*(3/4)
}
var chest__text_object = {
    obj_type: 'text',
    content: 'Sammeln',
    font: "30px Arial",
    startX: w*(3/4),
    startY: h*(3/4) + h/10 + 10
}
var balloon_object = {
    obj_type: 'image',
    file: 'stimuli/balloon.png',
    startX: w/2,
    startY: 3*h/4 - 100,
    scale: 1
}
var explosion_object = {
    obj_type: 'image',
    file: 'stimuli/peng.png',
    startX: w/2,
    startY: balloon_object.startY,
    scale: balloon_object.scale
}
var points_indicator_object = {
    obj_type: 'text',
    startX: 3*w/4,
    startY: 50,
    font: "30px Arial",
    content: "Punkte: " + points
}
//.
var n_stars = 0;
var n_coins = 0;

var head = document.head || document.getElementsByTagName('head')[0]; //define head

function create_star(points, n_str, n_stars_per_point) {
    var i = n_str;
    while (points >=  (i+1)*n_stars_per_point) {
        var css = 'img.absolute' + i + ' { position: absolute; top: 10px; left: ' + (100*i + 10) + 'px; z-index: 5; }';

        document.getElementById("stil").appendChild(document.createTextNode(css));

        var img = document.createElement("img");
        img.setAttribute("src", "stimuli/star.png");
        img.setAttribute("width", "100px");
        img.setAttribute("z-index", "5");
        img.setAttribute("alt", "Stern!");
        img.setAttribute("class", "absolute"+i);
        document.body.appendChild(img);

        i++;
        n_stars++;
    }
    return i;
}

//Self explanatory. For the animation and deletion of the coins.
function coins_to_trunk(n_coins) {
    var i = 0;
    while (i < n_coins) {
        var temp_coin = document.getElementById("star"+i);
        temp_coin.style.transform = 'translateY(' + ((-h/4) + 50) +'px)';
        temp_coin.style.transform += 'translateX(' + ((-w/4) + 50) +'px)';
        setTimeout(function() { 
            for (var i = 0; i < n_coins; i++) {
                var temp_coin = document.getElementById("star"+i);
                temp_coin.parentNode.removeChild(temp_coin); 
            }
        }, 700);
        i++;
    }
    return 0; //the return value is set to n_coins, since we deleted the coins after collection.
}

function create_coin(temp_points, n_coins, n_coins_per_point) {
    
    if (Math.round(temp_points/n_coins_per_point) > n_coins) { //[0,3] clicks = 0 coins, [4,11] clicks = 1 coin, [12,19] = 2 coins and so forth.
        
        //this style class contains the random position of the coin.
        var css = '.coin_absolute' + n_coins + ' { position: absolute; bottom: ' + (Math.round(Math.random()*100)) +'px; right: ' + (Math.round(Math.random()*100)) + 'px; z-index: 5; transition: transform 0.7s; }';

        //place the class element into the style element.
        document.getElementById("stil").appendChild(document.createTextNode(css));

        console.log(document.getElementById("stil"));

        var img = document.createElement("img");
        img.setAttribute("src", "stimuli/coin.png");
        img.setAttribute("width", "50px");
        img.setAttribute("id", "star"+n_coins);
        img.setAttribute("z-index", "5");
        img.setAttribute("alt", "Coin!");
        img.setAttribute("class", "coin_absolute"+n_coins);
        document.body.appendChild(img);

        n_coins++;
    }
    return n_coins; // n_coins is set to this return value.
}

var current = 0; //current number of pumps during trial. Is set to zero at the beginning of each trial.

var wait_trial = { //this is the explosion trial. It either finishes the experiment, or calls the main trial.
    type: 'psychophysics',
    stimuli: [background_image_object, cloud_object, cloud__text_object, chest_object,chest__text_object , explosion_object, points_indicator_object],
    choices: jsPsych.NO_KEYS,
    trial_duration: 1000,
    on_start: function() {
        pop_sound.play();
    },
    on_finish: function() {
        jsPsych.pauseExperiment();
        if (typeof trials_gone_through[max_rd_cursor] == 'undefined') {
            download(datatext, participants_id+".csv", "text/csv");
            jsPsych.finishTrial({correct_response: true});
            jsPsych.endExperiment();
        }
        else {
            balloon_object.scale = 1;
            balloon_object.startY = 3*h/4 - 100;
            inflation_trial.stimuli = [background_image_object, cloud_object, cloud__text_object, chest_object,chest__text_object , balloon_object, points_indicator_object];
            timing = 0;
            jsPsych.addNodeToEndOfTimeline({timeline: [inflation_trial]}, jsPsych.resumeExperiment);
        }   
    }
}
var timing = 0; //time of each trial. To be found in datatext.

function pulchrify(number) { //removes the last 10 digits of the given number ( in this proj, only used for time var.).
    number = number.toString();
    number = number.slice(0, -10);
    number = parseFloat(number, 10);
    return number;
}


var inflation_trial = { //We push this recursive trial to the timeline just once, and this is actually our whole experiment.
    type: 'psychophysics',
    stimuli: [background_image_object, cloud_object, cloud__text_object, chest_object, chest__text_object, balloon_object, points_indicator_object],
    response_type: 'mouse',
    background_color: 'white',
    on_finish: function(data){
        jsPsych.pauseExperiment();
        timing += data.rt/1000;
        data.rt = 0;
        if (data.click_x >= (w/4)-(h/10) && data.click_x <= (w/4)+(h/10) && data.click_y >= (h*(3/4))-(h/10) && data.click_y <= (h*(3/4))+(h/10)) {
            //if clicked on pump
            if (current < trials_gone_through[max_rd_cursor]) {
                current++;
                temp_points += pump_val;
                console.log("Pump!");
                n_coins = create_coin(temp_points, n_coins, n_coins_per_point);
                balloon_object.startY -= growth_factor/2;
                balloon_object.scale += growth_factor/200; 
                inflation_trial.stimuli = [background_image_object, cloud_object, cloud__text_object, chest_object, chest__text_object, balloon_object, points_indicator_object];
                jsPsych.addNodeToEndOfTimeline({timeline: [inflation_trial]}, jsPsych.resumeExperiment);
            }
            else { //if blew up
                datatext = datatext.concat(trials_gone_through[trial_cursor] + '; ' + trials_gone_through[max_rd_cursor] + '; ' + current + '; ' + '0' + '; ' + temp_points + '; ' + points + '; ' + pulchrify(timing) + ' \n');
                current = 0;
                timing = 0;
                console.log("Boom!");
                trial_cursor = trial_cursor + 2;
                max_rd_cursor = max_rd_cursor + 2;
                //delete the coins:
                for (var i = 0; i < n_coins; i++) {
                    var temp_coin = document.getElementById("star"+i);
                    temp_coin.parentNode.removeChild(temp_coin); 
                }
                //.
                n_coins = 0;
                temp_points = 0;
                explosion_object.scale = balloon_object.scale;
                explosion_object.startY = balloon_object.startY;
                jsPsych.addNodeToEndOfTimeline({timeline: [wait_trial]}, jsPsych.resumeExperiment);
            }
        }

        else if (data.click_x >= (3*w/4)-(h/10) && data.click_x <= (3*w/4)+(h/10) && data.click_y >= (h*(3/4))-(h/10) && data.click_y <= (h*(3/4))+(h/10)) {
            //if clicked on collect
            console.log("Collected!");
            points += temp_points;
            timing += data.rt/1000;
            if (current == 0) {
                console.log("Tried to collect without ever pumping.");
                jsPsych.addNodeToEndOfTimeline({timeline: [inflation_trial]}, jsPsych.resumeExperiment);
            }
            else {
                //collected
                datatext = datatext.concat(trials_gone_through[trial_cursor] + '; ' + trials_gone_through[max_rd_cursor] + '; ' + current + '; ' + '1' + '; ' + temp_points + '; ' + points + '; ' + pulchrify(timing) + ' \n'); 
                timing = 0;
                points_indicator_object.content = "Punkte: " + points;
                temp_points = 0;
                create_star(points, n_stars, n_stars_per_point);
                n_coins = coins_to_trunk(n_coins); // returns 0, so after collection, n_coins set to 0.
                trial_cursor = trial_cursor + 2;
                max_rd_cursor = max_rd_cursor + 2;
                if (trials_gone_through[trial_cursor] <= n_trials) {
                    //if there are still trials to go through
                    current = 0;
                    balloon_object.scale = 1;
                    balloon_object.startY = 3*h/4 - 100;
                    inflation_trial.stimuli = [background_image_object, cloud_object, cloud__text_object, chest_object, chest__text_object, balloon_object, points_indicator_object];
                    jsPsych.addNodeToEndOfTimeline({timeline: [inflation_trial]}, jsPsych.resumeExperiment);
                    
                }
                else {
                    //if no more trials
                    download(datatext, participants_id+".csv", "text/csv");
                    jsPsych.finishTrial({correct_response: true});
                    jsPsych.endExperiment();
                }

            }
                
        }
        else {
            //if the subject clicked on neither pump nor collect, that is, clicked on elsewhere that shouldn't change anything,
            //the same stimuli is queued so that nothing changes.
            console.log("clicked elsewhere.");
            inflation_trial.stimuli = [background_image_object, cloud_object, cloud__text_object, chest_object, chest__text_object, balloon_object, points_indicator_object];
            jsPsych.addNodeToEndOfTimeline({timeline: [inflation_trial]}, jsPsych.resumeExperiment);
        }
    }
}




timeline.push(inflation_trial);



jsPsych.init({
    timeline: timeline,
    //on_finish: function(){jsPsych.data.displayData();}
})