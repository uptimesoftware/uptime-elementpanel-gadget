$(function() {
	var myChart = null;
	var divsToDim = [ '#widgetChart', '#widgetSettings' ];

	$("#widgetSettings").hide();
	$("#widgetChart").hide();

	$("#saveSettings").click(function() {
		var elementId = $('#elementId').find(":selected").val();
		var refreshRate = $('#refreshRate').val();
		var lastCheckTime = $('#lastCheckTime').attr('checked');
		var lastTransitionTime = $('#lastTransitionTime').attr('checked');
		var message = $('#message').attr('checked');
		var isAcknowledged = $('#isAcknowledged').attr('checked');
		var acknowledgedComment = $('#acknowledgedComment').attr('checked');

		var settings = {
			'elementId' : elementId,
			'refreshRate' : refreshRate,
			'lastCheckTime' : lastCheckTime,
			'lastTransitionTime' : lastTransitionTime,
			'message' : message,
			'isAcknowledged' : isAcknowledged,
			'acknowledgedComment' : acknowledgedComment
		};
		uptimeGadget.saveSettings(settings).then(onGoodSave, onBadAjax);
	});

	$("#cancelSettings").click(function() {
		$("#widgetChart").show();
		$("#widgetSettings").hide();
		if (myChart) {
			myChart.startTimer();
		}
	});

	uptimeGadget.registerOnEditHandler(showEditPanel);
	uptimeGadget.registerOnLoadHandler(function() {
		uptimeGadget.loadSettings().then(onGoodLoad, onBadAjax);
	});

	function saveSettings() {

	}

	function showEditPanel() {
		// stop any existing timers in the charts (for when we save and change
		// settings)
		if (myChart) {
			myChart.stopTimer();
		}
		$("#widgetSettings").show();
		$("#widgetChart").hide();
	}

	function displayPanel(settings) {
		$("#widgetChart").show();
		$("#widgetSettings").hide();

		// Display the chart
		displayChart(settings);
	}

	function elementSort(arg1, arg2) {
		return naturalSort(arg1.name, arg2.name);
	}

	// Main Gadget Logic Start
	function onGoodLoad(settings) {
		$.ajax("/api/v1/elements/", {
			cache : false
		}).done(function(data, textStatus, jqXHR) {
			clearStatusBar();
			// fill in element drop down list
			data.sort(elementSort);
			var elementSelector = $('#elementId');
			$.each(data, function() {
				if (!this.isMonitored) {
					return;
				}
				elementSelector.append($("<option />").val(this.id).text(this.name));
			});

			// load existing saved settings, now that the drop down list has
			// been loaded
			if (settings) {
				// update (hidden) edit panel with settings
				$("#elementId").val(settings.elementId);
				$("#" + settings.chartType).prop("checked", true);
				$("#refreshRate").val(settings.refreshRate);
			}
		}).fail(
				function(jqXHR, textStatus, errorThrown) {
					displayStatusBar(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this),
							"Error Loading the List of Elements from up.time Controller");
				});

		if (settings) {
			displayPanel(settings);
		} else {
			showEditPanel();
		}
	}

	function displayStatusBar(error, msg) {
		gadgetDimOn();
		var statusBar = $("#statusBar").empty();
		uptimeErrorFormatter.getErrorBox(error, msg).appendTo(statusBar);
		statusBar.slideDown();
	}

	function clearStatusBar() {
		gadgetDimOff();
		$("#statusBar").slideUp().empty();
	}

	function gadgetDimOn() {
		$.each(divsToDim, function(i, d) {
			var div = $(d);
			if (div.is(':visible') && div.css('opacity') > 0.6) {
				div.fadeTo('slow', 0.3);
			}
		});
	}

	function gadgetDimOff() {
		$.each(divsToDim, function(i, d) {
			var div = $(d);
			if (div.is(':visible') && div.css('opacity') < 0.6) {
				div.fadeTo('slow', 1);
			}
		});
	}

	function onGoodSave(savedSettings) {
		clearStatusBar();
		displayPanel(savedSettings);
	}

	function onBadAjax(errorObject) {
		displayStatusBar(errorObject, "Error Communicating with up.time");
	}

	function displayChart(settings) {
		// stop any existing timers in the charts (for when we save and change
		// settings)
		if (myChart) {
			myChart.stopTimer();
		}

		// display chart
		myChart = new UPTIME.ElementStatusSimpleTableChart(settings, displayStatusBar, clearStatusBar);
	}

});
