$(function() {
	var elementMonitorListSettings = {
		'elementId' : -1,
		'refreshRate' : 15,
		'lastTransitionTime' : true,
		'lastCheckTime' : false,
		'message' : false,
		'isAcknowledged' : false,
		'acknowledgedComment' : false
	};
	var myChart = null;
	var divsToDim = [ '#widgetChart', '#widgetSettings' ];

	$("#widgetSettings").hide();

	$("#saveSettings").click(function() {
		elementMonitorListSettings.elementId = $('#elementId').val();
		elementMonitorListSettings.refreshRate = $('#refreshRate').val();
		elementMonitorListSettings.lastCheckTime = $('#lastCheckTime').prop('checked');
		elementMonitorListSettings.lastTransitionTime = $('#lastTransitionTime').prop('checked');
		elementMonitorListSettings.message = $('#message').prop('checked');
		elementMonitorListSettings.isAcknowledged = $('#isAcknowledged').prop('checked');
		elementMonitorListSettings.acknowledgedComment = $('#acknowledgedComment').prop('checked');

		uptimeGadget.saveSettings(elementMonitorListSettings).then(onGoodSave, onBadAjax);
	});

	$("#cancelSettings").click(function() {
		$("#widgetSettings").slideUp();
		if (myChart) {
			myChart.startTimer();
		}
	});

	uptimeGadget.registerOnEditHandler(showEditPanel);
	uptimeGadget.registerOnLoadHandler(function() {
		uptimeGadget.loadSettings().then(onGoodLoad, onBadAjax);
	});

	function saveSettings() {
		if ($.isEmptyObject(elementMonitorListSettings)) {
			return;
		}
		uptimeGadget.saveSettings(settings).then(onGoodSave, onBadAjax);
	}

	function showEditPanel() {
		// stop any existing timers in the charts (for when we save and change
		// settings)
		if (myChart) {
			myChart.stopTimer();
		}
		$("#widgetSettings").slideDown();
		$("#refreshRate").val(elementMonitorListSettings.refreshRate);
		$('#lastCheckTime').prop('checked', elementMonitorListSettings.lastCheckTime);
		$('#lastTransitionTime').prop('checked', elementMonitorListSettings.lastTransitionTime);
		$('#message').prop('checked', elementMonitorListSettings.message);
		$('#isAcknowledged').prop('checked', elementMonitorListSettings.isAcknowledged);
		$('#acknowledgedComment').prop('checked', elementMonitorListSettings.acknowledgedComment);
		return populateIdSelector();
	}

	function displayPanel(settings) {
		$("#widgetSettings").slideUp();

		// Display the chart
		displayChart(settings);
	}

	function elementSort(arg1, arg2) {
		return naturalSort(arg1.name, arg2.name);
	}

	function populateIdSelector() {
		var deferred = UPTIME.pub.gadgets.promises.defer();
		$('#elementId').empty().append($("<option />").val(-1).text("Loading..."));
		$.ajax("/api/v1/elements/", {
			cache : false
		}).done(function(data, textStatus, jqXHR) {
			clearStatusBar();
			// fill in element drop down list
			data.sort(elementSort);
			var elementSelector = $('#elementId').empty();
			$.each(data, function() {
				if (!this.isMonitored) {
					return;
				}
				elementSelector.append($("<option />").val(this.id).text(this.name));
			});
			if (elementMonitorListSettings.elementId >= 0) {
				elementSelector.val(elementMonitorListSettings.elementId);
			}
			deferred.resolve(true);
		}).fail(function(jqXHR, textStatus, errorThrown) {
			deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
		});
		return deferred.promise.then(null, function(error) {
			displayStatusBar(error, "Error Loading the List of Elements from up.time Controller");
		});
	}

	// Main Gadget Logic Start
	function onGoodLoad(settings) {
		if (settings) {
			// update (hidden) edit panel with settings
			$("#refreshRate").val(settings.refreshRate);
			$('#lastCheckTime').prop('checked', settings.lastCheckTime);
			$('#lastTransitionTime').prop('checked', settings.lastTransitionTime);
			$('#message').prop('checked', settings.message);
			$('#isAcknowledged').prop('checked', settings.isAcknowledged);
			$('#acknowledgedComment').prop('checked', settings.acknowledgedComment);
			$.extend(elementMonitorListSettings, settings);
		}
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
		// clean up any resources before creating a new chart.
		if (myChart) {
			myChart.destroy();
		}

		// display chart
		myChart = new UPTIME.ElementStatusSimpleTableChart(settings, displayStatusBar, clearStatusBar);
	}

});
