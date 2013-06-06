if (typeof UPTIME == "undefined") {
	var UPTIME = {};
}

// Define class/function name
if (typeof UPTIME.ElementStatusSimpleTableChart == "undefined") {
	UPTIME.ElementStatusSimpleTableChart = function(options, displayStatusBar, clearStatusBar) {
		var elementId = null;
		var refreshRate = null;
		var lastCheckTime = null;
		var lastTransitionTime = null;
		var message = null;
		var isAcknowledged = null;
		var acknowledgedComment = null;

		var chartTimer = null;

		if (typeof options == "object") {
			elementId = options.elementId;
			refreshRate = options.refreshRate;
			doLastCheckTime = options.lastCheckTime;
			doLastTransitionTime = options.lastTransitionTime;
			doMessage = options.message;
			doIsAcknowledged = options.isAcknowledged;
			doAcknowledgedComment = options.acknowledgedComment;
		}

		var statusCells = [ getStatusCellSpec("name", nameLink, "Monitor"), getStatusCellSpec("status", directValue, "Status"),
				getStatusCellSpec("lastTransitionTime", durationValue, "Duration") ];

		if (doLastCheckTime) {
			statusCells.push(getStatusCellSpec("lastCheckTime", directValue, "Last Check"));
		}
		if (doMessage) {
			statusCells.push(getStatusCellSpec("message", directValue, "Message"));
		}
		if (doIsAcknowledged) {
			statusCells.push(getStatusCellSpec("isAcknowledged", directValue, "Ack"));
		}
		if (doAcknowledgedComment) {
			statusCells.push(getStatusCellSpec("acknowledgedComment", directValue, "Ack Message"));
		}

		$('#statusTable tbody').on('click', onTableRowClick);

		// display the table (first time)
		updateChart();

		var statusTableSort = (function() {
			var statusMap = {
				'CRIT' : 0,
				'WARN' : 1,
				'MAINT' : 2,
				'UNKNOWN' : 3,
				'OK' : 4,
			};
			return function(arg1, arg2) {
				var sort = statusMap[arg1.status] - statusMap[arg2.status];
				if (sort != 0) {
					return sort;
				}
				sort = Date.parse(arg2.lastTransitionTime) - Date.parse(arg1.lastTransitionTime);
				if (sort != 0) {
					return sort;
				}
				sort = naturalSort(arg1.name, arg2.name);
				if (sort != 0) {
					return sort;
				}
				return 0;
			};
		}());

		function getStatusCellSpec(field, valueGetter, header) {
			return {
				field : field,
				valueGetter : valueGetter,
				header : header
			};
		}

		function directValue(monitorStatus, field, elementStatus, now) {
			var val = monitorStatus[field];
			return ((val || typeof val === 'boolean') ? val : " ");
		}

		function nameLink(monitorStatus, field, elementStatus, now) {
			var linkPrefix = "<a href='" + uptimeGadget.getElementUrls(elementStatus.id, elementStatus.name).services
					+ "' target='_top'>";
			return linkPrefix + monitorStatus[field] + "</a>";
		}

		function durationValue(monitorStatus, field, elementStatus, now) {
			return DateDiff.getDifferenceInEnglish(now, Date.parse(monitorStatus[field]));
		}

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

		function renderStatusTableHeaderRow() {
			var headerRow = '<tr>';
			$.each(statusCells, function() {
				headerRow += '<th>' + this.header + '</th>';
			});
			headerRow += '</tr>';

			return headerRow;
		}

		function renderStatusTableRows(monitorStatuses, elementStatus, now) {
			var rows = [];

			monitorStatuses.sort(statusTableSort);
			$.each(monitorStatuses, function(i, monitorStatus) {
				if (monitorStatus.isHidden) {
					return;
				}
				var row = '<tr class="status-row color-text-' + monitorStatus.status.toUpperCase() + '">';
				$.each(statusCells, function(i, statusCell) {
					row += '<td>' + statusCell.valueGetter(monitorStatus, statusCell.field, elementStatus, now) + '</td>';
				});
				row += '</tr>';
				rows.push(row);
			});

			return rows.join('');
		}

		function onTableRowClick(e) {
			window.top.location.href = $('a:first', e.currentTarget).attr('href');
		}

		function renderTables(elementStatus, textStatus, jqXHR) {
			clearStatusBar();

			// first let's empty out the existing table(s)
			var headerTable = $('#headerTable').empty();
			var statusTableHeader = $('#statusTable thead').empty();
			var statusTableBody = $('#statusTable tbody').empty();
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
			headerTable.append("<tr><th id='bigTableHeading'><a href='"
					+ uptimeGadget.getElementUrls(elementStatus.id, elementStatus.name).graphing + "' target='_top'>"
					+ elementStatus.name + "<br/><small><small>" + elementStatus.status + " for " + stateLength
					+ "</small></small>" + "</a></th><th>" + getStatusIcon(elementStatus.status) + "</th></tr>");

			statusTableHeader.append(renderStatusTableHeaderRow());
			statusTableBody.append(renderStatusTableRows(elementStatus.monitorStatus, elementStatus, currentDateTime));
		}

		function updateChart() {
			$.ajax("/api/v1/elements/" + elementId + "/status", {
				cache : false
			}).done(renderTables).fail(
					function(jqXHR, textStatus, errorThrown) {
						displayStatusBar(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this),
								"Error Getting Element Status from up.time Controller");
					});

			// Now let's set refresh rate for updating the table
			chartTimer = window.setTimeout(updateChart, refreshRate * 1000);
		}

		function stopChartTimer() {
			if (chartTimer) {
				window.clearTimeout(chartTimer);
			}
		}

		// public functions for this function/class
		var publicFns = {
			stopTimer : stopChartTimer,
			startTimer : function() {
				if (chartTimer) {
					updateChart();
				}
			},
			destroy : function() {
				$('#statusTable tbody').off('click');
				stopChartTimer();
			}
		};
		return publicFns; // Important: we need to return the public
		// functions/methods

	};
}