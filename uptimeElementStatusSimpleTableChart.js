if (typeof UPTIME == "undefined") {
	var UPTIME = {};
}

// Define class/function name
if (typeof UPTIME.ElementStatusSimpleTableChart == "undefined") {
	UPTIME.ElementStatusSimpleTableChart = function(options, displayStatusBar, clearStatusBar) {
		var elementId = null;
		var elementName = null;
		var elementType = null;
		var refreshRate = null;
		var lastCheckTime = null;
		var lastTransitionTime = null;
		var message = null;
		var isAcknowledged = null;
		var acknowledgedComment = null;

		var chartTimer = null;

		// Define custom sort for DataTable on status
		function statusSort(a) {
			switch (a.toUpperCase()) {
			case "CRIT":
				return 1;
			case "WARN":
				return 2;
			case "OK":
				return 3;
			case "UNKNOWN":
				return 4;
			case "MAINT":
				return 5;
			default:
				return 6;
			}
		}

		$.extend($.fn.dataTableExt.oSort, {
			"enum-pre" : statusSort,
			"enum-asc" : function(a, b) {
				return ((a < b) ? -1 : ((a > b) ? 1 : 0));
			},
			"enum-desc" : function(a, b) {
				return ((a < b) ? 1 : ((a > b) ? -1 : 0));
			},
			"natural-asc" : function(a, b) {
				return naturalSort(a, b);
			},
			"natural-desc" : function(a, b) {
				return naturalSort(a, b) * -1;
			}
		});

		if (typeof options == "object") {
			elementId = options.elementId;
			elementName = options.elementName;
			elementType = options.elementType;
			refreshRate = options.refreshRate;
			doLastCheckTime = options.lastCheckTime;
			doLastTransitionTime = options.lastTransitionTime;
			doMessage = options.message;
			doIsAcknowledged = options.isAcknowledged;
			doAcknowledgedComment = options.acknowledgedComment;
		}

		// display the table (first time)
		updateChart();

		function getStatusIcon(status) {
			switch (status.toUpperCase()) {
			case "CRIT":
				return '<span class="status-icon color-icon-CRIT"><i class="icon-minus-sign"></i></span>';
			case "WARN":
				return '<span class="status-icon color-icon-WARN"><i class="icon-warning-sign"></i></span>';
			case "OK":
				return '<span class="status-icon color-icon-OK"><i class="icon-ok"></i></span>';
			case "UNKNOWN":
				return '<span class="status-icon color-icon-UNKNOWN"><i class="icon-question-sign"></i></span>';
			case "MAINT":
				return '<span class="status-icon color-icon-MAINT"><i class="icon-exclamation-sign"></i></span>';
			default:
				return '<span class="status-icon color-icon-UNKNOWN"><i class="icon-question-sign"></i></span>';
			}
		}

		function renderTable(elementStatus, textStatus, jqXHR) {
			clearStatusBar();
			// let's setup the table columns
			var dataTableColumns = new Array();
			dataTableColumns = [ {
				"sTitle" : "Monitor (click to sort)",
				"aTargets" : [ 0 ],
				"sType" : "natural"
			}, {
				"sTitle" : "Status",
				"aTargets" : [ 1 ],
				"sType" : "enum"
			} ];
			var colsId = 1;

			if (doLastCheckTime) {
				colsId++;
				dataTableColumns.push({
					"sTitle" : "Last Check",
					"aTargets" : [ colsId ]
				});
			}
			if (doLastTransitionTime) {
				colsId++;
				dataTableColumns.push({
					"sTitle" : "Duration",
					"aTargets" : [ colsId ]
				});
			}
			if (doMessage) {
				colsId++;
				dataTableColumns.push({
					"sTitle" : "Message",
					"aTargets" : [ colsId ]
				});
			}
			if (doIsAcknowledged) {
				colsId++;
				dataTableColumns.push({
					"sTitle" : "Ack",
					"aTargets" : [ colsId ]
				});
			}
			if (doAcknowledgedComment) {
				colsId++;
				dataTableColumns.push({
					"sTitle" : "Ack Message",
					"aTargets" : [ colsId ]
				});
			}

			// first let's empty out the existing table(s)
			if ($.fn.dataTable.fnIsDataTable(document.getElementById('#statusTable'))) {
				$('#statusTable').dataTable().fnDestroy();
			}
			var headerTable = $('#headerTable').empty();
			var statusTable = $('#statusTable').empty();
			var topologyTable = $('#topologyTable').empty();

			// display topological dependencies, if there
			// are any
			var deps = elementStatus.topologyParentStatus;
			var divboxes = "";
			if (deps.length > 0) {
				for ( var i = 0; i < deps.length; i++) {
					var alink = "<a href='/main.php?section=Profile&subsection=&id=" + deps[i].id + "&name=" + deps[i].name
							+ "&dlsection=s_status' target='_top'>";
					divboxes += alink + '<div class="topoBox color-text-' + deps[i].status.toUpperCase() + '">' + deps[i].name
							+ "</div></a>";
				}
			}
			topologyTable.append("<tr><th colspan='2' style='text-align: left;'><div>Topological Dependencies:</div>" + divboxes
					+ "</th></tr>");

			// convert strings to dates
			var currentDateTime = new Date();
			currentDateTime = currentDateTime.getTime();
			var lastTransitionDateTime = Date.parse(elementStatus.lastTransitionTime);

			var stateLength = DateDiff.getDifferenceInEnglish(currentDateTime, lastTransitionDateTime);
			headerTable.append("<tr><th id='bigTableHeading'><a href='/main.php?section=Profile&subsection=&id="
					+ elementStatus.id + "&name=" + elementStatus.name + "' target='_top'>" + elementName.toUpperCase()
					+ "<br/><small><small>" + elementStatus.status + " for " + stateLength + "</small></small>" + "</a></th><th>"
					+ getStatusIcon(elementStatus.status) + "</th></tr>");

			$.each(elementStatus.monitorStatus,
					function() {
						// only display the monitors that are
						// visible (no hidden ones; ppg, etc)
						if (this.isHidden == false) {
							var alink = "<a href='/main.php?section=Profile&subsection=&id=" + elementStatus.id + "&name="
									+ elementStatus.name + "&dlsection=s_status' target='_top'>";
							var monitorName = "<td>" + alink + this.name + "</a></td>";
							var monitorStatus = "<td class='color-text-" + this.status.toUpperCase() + "'>" + this.status
									+ "</td>";
							var monitorLastCheck = "";
							var monitorLastTransition = "";
							var monitorMessage = "";
							var monitorIsAckd = "";
							var monitorAckMessage = "";

							if (doLastCheckTime) {
								monitorLastCheck = "<td>" + this.lastCheckTime + "</td>";
							}
							if (doLastTransitionTime) {
								monitorLastTransition = "<td>"
										+ DateDiff.getDifferenceInEnglish(currentDateTime, Date.parse(this.lastTransitionTime))
										+ "</td>";
							}
							if (doMessage) {
								monitorMessage = "<td>" + this.message + "</td>";
							}
							if (doIsAcknowledged) {
								monitorIsAckd = "<td>" + this.isAcknowledged + "</td>";
							}
							if (doAcknowledgedComment) {
								monitorAckMessage = "<td>" + ((this.acknowledgedComment) ? this.acknowledgedComment : " ")
										+ "</td>";
							}

							statusTable.append("<tr>" + monitorName + monitorStatus + monitorLastCheck + monitorLastTransition
									+ monitorMessage + monitorIsAckd + monitorAckMessage + "</tr>");
						}
					});

			// DataTable
			statusTable.dataTable({
				"aoColumnDefs" : dataTableColumns,
				"aaSorting" : [ [ 1, "asc" ], [ 0, "asc" ] ],
				"bInfo" : false,
				"bPaginate" : false,
				"bFilter" : false
			});

		}

		function updateChart() {
			$.ajax("/api/v1/elements/" + elementId + "/status", {
				cache : false
			}).done(renderTable).fail(
					function(jqXHR, textStatus, errorThrown) {
						displayStatusBar(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this),
								"Error Getting Element Status from up.time Controller");
					});

			// Now let's set refresh rate for updating the table
			chartTimer = window.setTimeout(updateChart, refreshRate * 1000);
		}

		// function to make sure we return two digits (09 instead of 9, 00
		// instead of 0, etc) for date/time (used for Last Refresh Time)
		function checkDateTimeTwoDigits(time) {
			return (time < 10) ? ("0" + time) : time;
		}

		// public functions for this function/class
		var publicFns = {
			stopTimer : function() {
				if (chartTimer) {
					window.clearTimeout(chartTimer);
				}
			},
			startTimer : function() {
				if (chartTimer) {
					updateChart();
				}
			}
		};
		return publicFns; // Important: we need to return the public
		// functions/methods

	};
}