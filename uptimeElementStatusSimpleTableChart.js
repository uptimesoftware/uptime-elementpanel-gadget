if (typeof UPTIME == "undefined") {
        var UPTIME = {};
}

// Define class/function name
if (typeof UPTIME.ElementStatusSimpleTableChart == "undefined") {
	UPTIME.ElementStatusSimpleTableChart = function(options) {
		var chartDivId = null;
		var lastRefreshBarDivId = null;
		var statusBarDivId = null;
		var entityId   = null;
		var entityName = null;
		var entityType = null;
		var uptime_api = null;
		var refreshRate = null;
		var lastCheckTime = null;
		var lastTransitionTime = null;
		var message = null;
		var isAcknowledged = null;
		var acknowledgedComment = null;
		var UPTIME_GADGET_BASE = null;

		var chartTimer = null;



		// Define custom sort for DataTable on status
		function statusSort( a ) {
			// Add / alter the switch statement below to match your enum list
			switch( a.toUpperCase() ) {
				case "CRIT":    return 1;
				case "WARN":    return 2;
				case "OK":      return 3;
				case "UNKNOWN": return 4;
				case "MAINT":   return 5;
				default:        return 6;
			}
		}
		
		jQuery.extend( jQuery.fn.dataTableExt.oSort, {
			"enum-pre": function ( a ) {
				// for some reason, it doesn't use thist function, so we'll create our own
			
				// Add / alter the switch statement below to match your enum list
				switch( a.toUpperCase() ) {
					case "CRIT":    return 1;
					case "WARN":    return 2;
					case "OK":      return 3;
					case "UNKNOWN": return 4;
					case "MAINT":   return 5;
					default:        return 6;
				}
			},
			"enum-asc": function ( a, b ) {
				a = statusSort(a);
				b = statusSort(b);
				return ((a < b) ? -1 : ((a > b) ? 1 : 0));
			},
			"enum-desc": function ( a, b ) {
				a = statusSort(a);
				b = statusSort(b);
				return ((a < b) ? 1 : ((a > b) ? -1 : 0));
			}
		} );






		if (typeof options == "object") {
			chartDivId     = '#' + options.chartDivId;
			lastRefreshBarDivId = "#" + options.lastRefreshBarDivId;
			statusBarDivId      = '#' + options.statusBarDivId;
			entityId            = options.entityId;
			entityName          = options.entityName;
			entityType          = options.entityType;
			uptime_api          = options.uptime_api;
			refreshRate         = options.refreshRate;
			doLastCheckTime        = options.lastCheckTime;
			doLastTransitionTime   = options.lastTransitionTime;
			doMessage              = options.message;
			doIsAcknowledged       = options.isAcknowledged;
			doAcknowledgedComment  = options.acknowledgedComment;
			UPTIME_GADGET_BASE     = options.UPTIME_GADGET_BASE;
		}
		
		// display the table (first time)
		updateChart();
		
		function updateChart() {
			uptime_api.getElementStatus(entityId,function(elementStatus) {
				
				//console.log(elementStatus);

				// let's setup the table columns
				var dataTableColumns = new Array();
				dataTableColumns = [ {"sTitle": "Monitor (click to sort)", "aTargets":[0]},
						{"sTitle": "Status", "aTargets":[1], "sType": "enum"}
				];
				var colsId = 1;
						
				if (doLastCheckTime) {
					colsId++;
					dataTableColumns.push( {"sTitle": "Last Check", "aTargets":[colsId]} );
				}
				if (doLastTransitionTime) {
					colsId++;
					dataTableColumns.push( {"sTitle": "Duration", "aTargets":[colsId]} );
				}
				if (doMessage) {
					colsId++;
					dataTableColumns.push( {"sTitle": "Message", "aTargets":[colsId]} );
				}
				if (doIsAcknowledged) {
					colsId++;
					dataTableColumns.push( {"sTitle": "Ack", "aTargets":[colsId]} );
				}
				if (doAcknowledgedComment) {
					colsId++;
					dataTableColumns.push( {"sTitle": "Ack Message", "aTargets":[colsId]} );
				}

				
				// first let's empty out the existing table(s)
				$(chartDivId).empty();
				$(chartDivId).append("<table id='headerTable' style='width:100%; border:0px;'></table>");
				$(chartDivId).append("<table id='statusTable' style='width:100%; border:0px;'><tbody></tbody></table>");
				$(chartDivId).append("<table id='topologyTable' style='width:100%; border:0px;'><tbody></tbody></table>");
				var cols = 2;
				
				// determine which icon to use for the system
				var elementIcon = "icon-system.gif";
				if (entityType == 'Windows') {
					elementIcon = "icon-systemWindows.gif";
				}
				else if (entityType == 'Linux') {
					elementIcon = "icon-systemLINUX.gif";
				}
				else if (entityType == 'Aix') {
					elementIcon = "icon-systemAIX.gif";
				}
				else if (entityType == 'Solaris') {
					elementIcon = "icon-systemSUN.gif";
				}
				else if (entityType == 'Hpux') {
					elementIcon = "icon-systemHP.gif";
				}
				else if (entityType == 'VcenterServer') {
					elementIcon = "vmware/VirtualCenter.png";
				}
				else if (entityType == 'VcenterHostSystem') {
					elementIcon = "icon-multi-VMWare.gif";
				}
				else if (entityType == 'Application') {
					elementIcon = "icon-app.gif";
				}
				
				
				// determine which icon to use for the status
				var statusIconSize = 32;
				var statusIcon = UPTIME_GADGET_BASE + "/images/status-" + elementStatus.status.toLowerCase() + ".png";

				
				// display topological dependencies, if there are any
				var deps = elementStatus.topologyParentStatus;
//console.log(deps);
				var divboxes = "";
				if (deps.length > 0) {
					for (i = 0; i < deps.length; i++) {
						var alink = "<a href='/main.php?section=Profile&subsection=&id="+deps[i].id+"&name="+deps[i].name+"&dlsection=s_status' target='_top'>";
						divboxes += alink + "<div id='topBox"+deps[i].status.toUpperCase()+"'>"+deps[i].name+"</div></a>";
					}
				}
				$("#topologyTable").append("<tr><th colspan='2' style='text-align: left;'><div>Topological Dependencies:</div>"+divboxes+"</th></tr>");

				// convert strings to dates
				var currentDateTime        = new Date();
				currentDateTime            = currentDateTime.getTime();
				var lastTransitionDateTime = Date.parse(elementStatus.lastTransitionTime);
//console.log("Cur Time: " + currentDateTime);
				
				var stateLength = DateDiff.getDifferenceInEnglish(currentDateTime, lastTransitionDateTime);

				elementIcon = "<img src='/images/" + elementIcon + "' border='0px' />";
				statusIcon = "<img src='" + statusIcon + "' width='" + statusIconSize + "' height='" + statusIconSize + "' border='0px' />";
				$("#headerTable").append("<tr><th id='bigTableHeading'><a href='/main.php?section=Profile&subsection=&id=" +
				elementStatus.id+"&name="+elementStatus.name+"' target='_top'>"+elementIcon+entityName.toUpperCase() + "<br/><small><small>"+elementStatus.status+" for "+stateLength+"</small></small>" +
				"</a></th><th>"+statusIcon+"</th></tr>");
				
				$.each(elementStatus.monitorStatus, function() {
					// only display the monitors that are visible (no hidden ones; ppg, etc)
					if (this.isHidden == false) {
						var alink = "<a href='/main.php?section=Profile&subsection=&id="+elementStatus.id+"&name="+elementStatus.name+"&dlsection=s_status' target='_top'>";	// <a href=... tag for the element's service statuses
						var monitorName = "<td>" + alink + this.name + "</a></td>";
						var monitorStatus = "<td class='" + this.status.toUpperCase() + "'>" + this.status + "</td>";
						var monitorLastCheck = "";
						var monitorLastTransition = "";
						var monitorMessage = "";
						var monitorIsAckd = "";
						var monitorAckMessage = "";
						
						if (doLastCheckTime) {
							monitorLastCheck = "<td>" + this.lastCheckTime + "</td>";
						}
						if (doLastTransitionTime) {
							//monitorLastTransition = "<td>" + this.lastTransitionTime + "</td>";
							monitorLastTransition = "<td>" + DateDiff.getDifferenceInEnglish(currentDateTime, Date.parse(this.lastTransitionTime)) + "</td>";
						}
						if (doMessage) {
							monitorMessage = "<td>" + this.message + "</td>";
						}
						if (doIsAcknowledged) {
							monitorIsAckd = "<td>" + this.isAcknowledged + "</td>";
						}
						if (doAcknowledgedComment) {
							monitorAckMessage = "<td>" + this.acknowledgedComment + "</td>";
						}
						
						$("#statusTable").append("<tr>" + monitorName + monitorStatus + monitorLastCheck + monitorLastTransition + monitorMessage + monitorIsAckd + monitorAckMessage + "</tr>");
					}
				});
				
				// update lastRefreshBar
				$(lastRefreshBarDivId).show();
				var dt = new Date();
				$(lastRefreshBarDivId).html("<small>Last refreshed: " + checkDateTimeTwoDigits(dt.getMonth()+1) + "/" + checkDateTimeTwoDigits(dt.getDate()) + "/" + dt.getFullYear() + " - " +
							checkDateTimeTwoDigits(dt.getHours())+ ":" + checkDateTimeTwoDigits(dt.getMinutes()) + ":" + checkDateTimeTwoDigits(dt.getSeconds()) + "</small>");
				
				// DataTable
				$('#statusTable').dataTable({
					"aoColumnDefs": dataTableColumns,
					"aaSorting": [[ 1, "asc" ], [ 0, "asc" ]],
					"bInfo": false,
					"bPaginate": false,
					"bFilter": false
				});
				
				
			},function(jqXHR, textStatus, errorThrown) {
				var statusBar = $(statusBarDivId);
				statusBar.css("color", "red");
				statusBar.text("Can't connect to the up.time API.");
				statusBar.show();
			});
			
			// Now let's set refresh rate for updating the table
			chartTimer = window.setTimeout(updateChart, refreshRate*1000);
		}


		// function to make sure we return two digits (09 instead of 9, 00 instead of 0, etc) for date/time (used for Last Refresh Time)
		function checkDateTimeTwoDigits(time){
			return (time < 10) ? ("0" + time) : time;   
		}

		// public functions for this function/class
		var public = {
			stopTimer: function() {
				if (chartTimer) {
					window.clearTimeout(chartTimer);
				}
			},
			startTimer: function() {
				if (chartTimer) {
					updateChart();
				}
			}
		};
		return public;	// Important: we need to return the public functions/methods

	};
}