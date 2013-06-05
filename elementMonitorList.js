$(function() {
	var uptime_api = new uptimeApi();
	var myChart = null;

	$("#widgetSettings").hide();
	$("#widgetChart").hide();
	$("#lastRefreshBar").hide();

	function showEditPanel() {
		// stop any existing timers in the charts (for when we save and change
		// settings)
		if (myChart) {
			myChart.stopTimer();
		}
		$("#widgetSettings").show();
		$("#widgetChart").hide();
		$("#lastRefreshBar").hide();
	}

	$("#saveSettings").click(function() {
		// var radioId = $("#widgetOptions
		// input[name=chartType]:radio:checked").val();
		var entityId = $('#elementId').find(":selected").val();
		var entityName = $('#elementId').find(":selected").text();

		var selectedIndex = $('#elementId').get(0).selectedIndex;
		var entityType = $('#elementType')[0][selectedIndex].innerText;

		var refreshRate = $('#refreshRate').val();
		var lastCheckTime = $('#lastCheckTime').attr('checked');
		var lastTransitionTime = $('#lastTransitionTime').attr('checked');
		var message = $('#message').attr('checked');
		var isAcknowledged = $('#isAcknowledged').attr('checked');
		var acknowledgedComment = $('#acknowledgedComment').attr('checked');

		// save group name for now, just for demo purposes
		var settings = {
			'entityId' : entityId,
			'entityName' : entityName,
			'entityType' : entityType,
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
		$("#lastRefreshBar").hide();
		if (myChart) {
			myChart.startTimer();
		}
	});

	function displayPanel(settings) {
		$("#widgetChart").show();
		$("#widgetSettings").hide();
		$("#lastRefreshBar").hide();

		// Display the chart
		displayChart(settings);
	}

	function elementSort(arg1, arg2) {
		return naturalSort(arg1.name, arg2.name);
	}

	// Main Gadget Logic Start
	function onGoodLoad(settings) {
		var statusBar = $("#statusBar");

		uptime_api.getElements("isMonitored=true", function(data) {

			// console.log(data);

			// fill in element drop down list
			var optionsValues = '<select id="elementId">';
			var optionsTypeValues = '<select id="elementType" style="visibility: hidden;">';
			data.sort(elementSort);
			$.each(data, function() {

				// console.log(this.typeSubtype);

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
				$("#elementId").val(settings.entityId);
				$("#" + settings.chartType).prop("checked", true);
				$("#refreshRate").val(settings.refreshRate);
			}
		}, function(jqXHR, textStatus, errorThrown) {
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
		// add/edit settings object with extra properties
		settings["chartDivId"] = "widgetChart";
		settings["statusBarDivId"] = "statusBar";
		settings["lastRefreshBarDivId"] = "lastRefreshBar";
		settings["uptime_api"] = uptime_api;
		settings["UPTIME_GADGET_BASE"] = "__UPTIME_GADGET_BASE__";

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
