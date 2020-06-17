    // NEWS
    let eventsProbabInterval = [];
    let i = 0;
    let maxnum = 0;
    let teams = ['ManUtd', 'ManCity', 'Tottenham', 'Chelsea', 'Arsenal', 'Liverpool', 'Barcelona', 'Madrid', 'Atletico', 'Dortmund', 'Bayern', 'PSG'];

    //miracle = 1%, rare = 5%, frequent = 15%, everyday = 30%
    let events = [
        { event: "player_leave", probability: 15, func: player_leave },
        { event: "sheikh_takeover", probability: 1, func: sheikh_takeover },
        { event: "injury", probability: 30, func: injury }
    ];

    for (let i = 0; i < events.length; i++) {
        maxnum = maxnum + events[i].probability;
        eventsProbabInterval[i] = maxnum;
    }

    for (let i = 0; i < teams.length; i++) {
        newsNumber = randomInt(maxnum);
        console.log("newsNumber: " + newsNumber);

        if (newsNumber <= events[0].probability) {
            console.log(teams[i] + ": ");
            events[0].func();
        }

        for (let j = 1; j < events.length; j++) {
            if (newsNumber > eventsProbabInterval[j - 1] && newsNumber <= eventsProbabInterval[j]) {
                console.log(teams[i] + ": ");
                events[j].func();
            }
        }
    };

    function randomInt(max) {
        randomInteger = Math.floor(Math.random() * max) + 1;
        return randomInteger;
    };

    function sheikh_takeover() {
        console.log('Sheikh took over your club.');
    }

    function injury() {
        console.log('Your star player is injured.');
    }

    function player_leave() {
        console.log('Player wants to leave club.');
    }

//console.log(maxnum);
//console.log(eventsProbabInterval);