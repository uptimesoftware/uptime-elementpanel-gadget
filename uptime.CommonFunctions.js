// http://ditio.net/2010/05/02/javascript-date-difference-calculation/
var DateDiff = {

	getDifferenceInEnglish: function(futureDateInMilli, pastDateInMilli) {
		var stateLength = "";
		
		// calculate how long they've been in that state for
		var timeInCurrentStateSecs = Math.round((futureDateInMilli - pastDateInMilli)/1000);	// get length of state
		var timeInCurrentStateDays = Math.round(timeInCurrentStateSecs/60/60/24);	// convert to days
		
		if (timeInCurrentStateDays < 0) { timeInCurrentStateDays = 0; }	// make sure we don't get any negative values
		timeInCurrentStateSecs = timeInCurrentStateSecs - (timeInCurrentStateDays*24*60*60);		// subtract the days
		
		var timeInCurrentStateHours = Math.round(timeInCurrentStateSecs/60/60);	// convert to hours
		if (timeInCurrentStateHours < 0) { timeInCurrentStateHours = 0; }	// make sure we don't get any negative values
		timeInCurrentStateSecs = timeInCurrentStateSecs - (timeInCurrentStateHours*60*60);		// subtract the hours
		
		var timeInCurrentStateMins = Math.round(timeInCurrentStateSecs/60);	// convert to minutes
		if (timeInCurrentStateMins < 0) { timeInCurrentStateMins = 0; }	// make sure we don't get any negative values
		timeInCurrentStateSecs = timeInCurrentStateSecs - (timeInCurrentStateMins*60);		// subtract the minutes
		if (timeInCurrentStateSecs < 0) { timeInCurrentStateSecs = 0; }	// make sure we don't get any negative values
		
		// put the times all into a string
		if (timeInCurrentStateDays > 0) {
			stateLength += "+" + timeInCurrentStateDays + " days";
		}
		else if (timeInCurrentStateHours > 0) {
			stateLength += "+" + timeInCurrentStateHours + " hours";
		}
		else {
			stateLength += "+" + timeInCurrentStateMins + " mins";
		}
		
		return stateLength;
	},



    inSeconds: function(d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();
 
        return parseInt((t2-t1)/(1000));
    },
	
    inMinutes: function(d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();
 
        return parseInt((t2-t1)/(60*1000));
    },
	
    inHours: function(d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();
 
        return parseInt((t2-t1)/(24*60*1000));
    },
	
    inDays: function(d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();
 
        return parseInt((t2-t1)/(24*3600*1000));
    },
 
    inWeeks: function(d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();
 
        return parseInt((t2-t1)/(24*3600*1000*7));
    },
 
    inMonths: function(d1, d2) {
        var d1Y = d1.getFullYear();
        var d2Y = d2.getFullYear();
        var d1M = d1.getMonth();
        var d2M = d2.getMonth();
 
        return (d2M+12*d2Y)-(d1M+12*d1Y);
    },
 
    inYears: function(d1, d2) {
        return d2.getFullYear()-d1.getFullYear();
    }
}

