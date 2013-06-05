$(function() {
	var myChart = null;

	$("#widgetSettings").hide();
	$("#widgetChart").hide();

	function showEditPanel() {
		// stop any existing timers in the charts (for when we save and change
		// settings)
		if (myChart) {
			myChart.stopTimer();
		}
		$("#widgetSettings").show();
		$("#widgetChart").hide();
	}

	$("#saveSettings").click(function() {
		var elementId = $('#elementId').find(":selected").val();
		var elementName = $('#elementId').find(":selected").text();

		var selectedIndex = $('#elementId').get(0).selectedIndex;
		var elementType = $('#elementType')[0][selectedIndex].innerText;

		var refreshRate = $('#refreshRate').val();
		var lastCheckTime = $('#lastCheckTime').attr('checked');
		var lastTransitionTime = $('#lastTransitionTime').attr('checked');
		var message = $('#message').attr('checked');
		var isAcknowledged = $('#isAcknowledged').attr('checked');
		var acknowledgedComment = $('#acknowledgedComment').attr('checked');

		var settings = {
			'elementId' : elementId,
			'elementName' : elementName,
			'elementType' : elementType,
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
			// fill in element drop down list
			var optionsValues = '<select id="elementId">';
			var optionsTypeValues = '<select id="elementType" style="visibility: hidden;">';
			data.sort(elementSort);
			$.each(data, function() {
				if (!this.isMonitored) {
					return;
				}
				optionsValues += '<option value="' + this.id + '">' + this.name + '</option>';
				optionsTypeValues += '<option value="' + this.id + '">' + this.typeSubtype + '</option>';
			});
			optionsValues += '</select>';
			optionsTypeValues += '</select>';
			$('#availableElements').html(optionsValues);
			$('#availableElements').append(optionsTypeValues);

			// load existing saved settings, now that the drop down list has
			// been loaded
			if (settings) {
				// update (hidden) edit panel with settings
				$("#elementId").val(settings.elementId);
				$("#" + settings.chartType).prop("checked", true);
				$("#refreshRate").val(settings.refreshRate);
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			var statusBar = $("#statusBar");
			statusBar.css("color", "red");
			statusBar.text("Can't connect to the up.time API.");
			statusBar.show();
		});

		if (settings) {
			displayPanel(settings);
		} else {
			showEditPanel();
		}
	}

	function onGoodSave(savedSettings) {
		var statusBar = $("#statusBar");

		statusBar.css("color", "green");
		statusBar.text("Updated settings!");
		statusBar.show().fadeOut(2000);

		displayPanel(savedSettings);
	}

	function onBadAjax(errorObject) {
		var statusBar = $("#statusBar");
		statusBar.css("color", "red");

		statusBar.text(errorObject.code + ": " + errorObject.description);
		statusBar.show().fadeOut(2000);
	}

	function displayChart(settings) {
		// stop any existing timers in the charts (for when we save and change
		// settings)
		if (myChart) {
			myChart.stopTimer();
		}

		// display chart
		myChart = new UPTIME.ElementStatusSimpleTableChart(settings);
	}

	// Always load these at the end
	uptimeGadget.registerOnEditHandler(showEditPanel);
	uptimeGadget.registerOnLoadHandler(function() {
		uptimeGadget.loadSettings().then(onGoodLoad, onBadAjax);
	});
	// uptimeGadget.registerOnUploadFile(function (e){});

});
