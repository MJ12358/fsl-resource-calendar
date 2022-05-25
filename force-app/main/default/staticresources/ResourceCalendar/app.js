/* global
  $
  dayjs
  rivets
  FullCalendar
  ResourceCalendarController
*/

/* eslint
  no-unused-vars: "warn",
  no-empty: "warn"
*/

(function() {
	'use strict';

	let appointmentSource = {
		id: 'appointments',
		display: 'block',
		events: function(info, onSuccess, onFailure) {
			ResourceCalendarController.getAppointments(
				info.start.getTime(),
				info.end.getTime(),
				(response, event) => {
					if (event.status) {
						onSuccess(response);
					} else {
						onFailure(event);
					}
				}
			);
		},
		success: function(events) {
			viewModel.workTypes = events.reduce((a, c) => {
				if (a.indexOf(c.WorkType.Name) == -1) {
					a.push(c.WorkType.Name);
				}
				return a;
			}, []);
		},
		failure: function(event) {
			viewModel.showAlert(event.type, event.message);
		},
		eventDataTransform: function(record) {
			if (viewModel.selectedResource.length > 0 && record.ServiceResources) {
				let arr = record.ServiceResources.filter(v => viewModel.selectedResource.includes(v.ServiceResourceId));
				if (arr.length === 0) {
					return false;
				}
			}
			if (viewModel.selectedStatus.length > 0 && !viewModel.selectedStatus.includes(record.Status)) {
				return false;
			}
			if (viewModel.selectedType.length > 0 && !viewModel.selectedType.includes(record.WorkType.Name)) {
				return false;
			}
			return new Appointment(record);
		}
	};

	let absenceSource = {
		id: 'absenses',
		color: '#999999',
		display: 'block',
		events: function(info, onSuccess, onFailure) {
			if (viewModel.selectedResource.length === 0) {
				onSuccess([]);
				return;
			}
			ResourceCalendarController.getAbsences(
				info.start.getTime(),
				info.end.getTime(),
				viewModel.selectedResource,
				(response, event) => {
					if (event.status) {
						onSuccess(response);
					} else {
						onFailure(event);
					}
				}
			);
		},
		failure: function(event) {
			viewModel.showAlert(event.type, event.message);
		},
		eventDataTransform: function(record) {
			return new Absence(record);
		}
	};

	let holidaySource = {
		id: 'holidays',
		color: 'pink',
		display: 'block',
		textColor: 'black',
		events: function(info, onSuccess, onFailure) {
			ResourceCalendarController.getHolidays(
				info.start.getTime(),
				info.end.getTime(),
				(response, event) => {
					if (event.status) {
						onSuccess(response);
					} else {
						onFailure(event);
					}
				}
			);
		},
		success: function(response) {
			return Object.keys(response).map(v => {
				return {
					id: response[v].Id,
					start: parseInt(v) + getTzo(v),
					title: decodeHtml(response[v].Name),
					allDay: response[v].IsAllDay
				};
			});
		},
		failure: function(event) {
			viewModel.showAlert(event.type, event.message);
		}
	}

	const KEYS = {
		SELECTED_RESOURCE: 'vf.resourceCalendar.selectedResource',
		SELECTED_STATUS: 'vf.resourceCalendar.selectedStatus',
		SELECTED_TYPE: 'vf.resourceCalendar.selectedType'
	};
	const ELEMENT = document.getElementById('calendar');
	const CONFIG = {
		allDaySlot: true,
		buttonText: {
			today: 'Today',
			month: 'Month',
			week: 'Week',
			day: 'Day', 
			list: 'List'
		},
		customButtons: {
			exportToCsv: {
				text: 'Export',
				click: onExportToCsv
			}
		},
		dayMaxEventRows: true,
		dayPopoverFormat: {
			day: 'numeric',
			month: 'long',
			weekday: 'long'
		},
		defaultTimedEventDuration: '00:30:00',
		editable: false,
		eventClick: onEventClick,
		eventDidMount: onEventDidMount,
		eventSources: [
			appointmentSource,
			absenceSource,
			holidaySource
		],
		forceEventDuration: true,
		handleWindowResize: true,
		headerToolbar: {
			left: 'prev,next today exportToCsv',
			center: 'title',
			right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
		},
		height: '100%',
		initialDate: new Date(),
		initialView: 'dayGridMonth',
    loading: (b) => !b && $('#spinner').fadeOut(),
		moreLinkClick: 'popover',
		navLinks: true,
		nowIndicator: true,
		selectable: false,
		slotMinTime: '00:00:00',
		slotMaxTime: '24:00:00',
		themeSystem: 'bootstrap',
		viewDidMount: onViewMount,
		weekNumbers: false
	};

	//* Models

	function Appointment(record) {
		this.id = record.Id;
		this.start = record.SchedStartTime || record.ArrivalWindowStartTime;
		this.end = record.SchedEndTime || record.ArrivalWindowEndTime;
		this.color = getColor(record.Status);
		this.title = decodeHtml(record.FSL__GanttLabel__c || record.AppointmentNumber);
		this.extendedProps = Object.assign(this.extendedProps || {}, record);
		this.tooltip = `<b>${record.AppointmentNumber} / ${record.FSL__GanttLabel__c || ''}</b> (${record.Status})<br>`
			+ `${getResources()}`
			+ `${record.Street} ${record.City}, ${record.State} ${record.PostalCode}<br>`
			+	`${getDates()}`;
		
		function getResources() {
			let result = '';
			if (!record.ServiceResources || record.ServiceResources.length <= 0) {
				return result;
			}
			record.ServiceResources.forEach(v => {
				result += `${v.ServiceResource.Name} - ${v.ServiceResource.FSL__GanttLabel__c}<br>`;
			});
			return result;
		}

		function getDates() {
			if (record.SchedStartTime) {
				return `Scheduled Start: ${formatDate(record.SchedStartTime)}<br>`
					+ `Scheduled End: ${formatDate(record.SchedEndTime)}`;
			}
			if (record.ArrivalWindowStartTime) {
				return `Arrival Start: ${formatDate(record.ArrivalWindowStartTime)}<br>`
					+ `Arrival End: ${formatDate(record.ArrivalWindowEndTime)}`;
			}
			return '';
		}
	}

	function Absence(record) {
		this.id = record.Id;
		this.start = record.Start;
		this.end = record.End;
		this.title = record.FSL__GanttLabel__c;
		this.extendedProps = Object.assign(this.extendedProps || {}, record);
		this.tooltip = `<b>${record.AbsenceNumber} / ${record.FSL__GanttLabel__c}</b> (${record.Type})<br>`
			+ `Resource: ${record.Resource.Name}<br>`
			+ `Start: ${formatDate(record.Start)}<br>`
			+ `End: ${formatDate(record.End)}`;
	}

	//* Full calendar events

	function onViewMount(view, el) {
    console.log('onViewMount');
		// move the work type selector into the toolbar
		let select = document.getElementById('type-select');
		ELEMENT.querySelector('.fc-header-toolbar .fc-toolbar-chunk:first-of-type').appendChild(select);
	}

	function onEventDidMount(info) {
		let props = info.event.extendedProps;
		if (!props || !props.tooltip) {
			return;
		}
		let options = {
			title: props.tooltip,
			placement: 'top',
			trigger: 'hover',
			container: 'body',
			html: true,
			delay: {
				show: 500,
				hide: 100
			}
		};
		$(info.el).tooltip(options);
	}

	function onEventClick(info) {
		let props = info.event.extendedProps;
		if (!props || !props.Id) {
			return;
		}
		let a = document.createElement('a');
		a.href = `/${props.Id}`;
		a.target = '_blank';
		a.click();
		a.remove();
	}

	function onExportToCsv() {
		let arr = CALENDAR.getEvents()
			.filter(v => v.source.id === 'appointments')
			.reduce((a, c) => {
				// SF dosent like relationships sent back to it without proper formatting so just filter them out
				let r = Object.fromEntries(
					Object.entries(c.extendedProps).filter(([key, value]) => (typeof value === 'string' || typeof value === 'number'))
				);
				a.push(r);
				return a;
			}, []);
		ResourceCalendarController.exportToCsv(JSON.stringify(arr), (result, event) => {
			if (event.status) {
				let a = document.createElement('a');
				// this does not work for lengthly csv's
				a.href = 'data:text/csv;charset=utf-8,' + encodeURI(result);
				a.target = '_blank';
				a.download = 'ServiceAppointment_Export.csv';
				a.click();
				a.remove();
			} else {
				viewModel.showAlert(event.type, event.message);
			}
		});
	}

	//* View model

	function ViewModel() {
		const self = this;

		this.alertOpen = false;
		this.alertTitle = '';
		this.alertMessage = '';

		this.resources = [];
		this.selectedResource = getItem(KEYS.SELECTED_RESOURCE) || [];
		this.selectedStatus = getItem(KEYS.SELECTED_STATUS) || [];
		this.selectedType = getItem(KEYS.SELECTED_TYPE) || [];
		this.statuses = [];
		this.workTypes = [];

		this.onResourceClick = function(event, resourceId) {
			let foundResource = self.resources.find(a => a.Id === resourceId);
			let index = self.selectedResource.indexOf(foundResource.Id);
			if (index != -1) {
				self.selectedResource.splice(index, 1);
			} else {
				self.selectedResource.push(foundResource.Id);
			}
			CALENDAR.refetchEvents();
			bind.update(self);
			setItem(KEYS.SELECTED_RESOURCE, self.selectedResource);
		};

		this.onStatusClick = function(event, status) {
			let index = self.selectedStatus.indexOf(status);
			if (index != -1) {
				self.selectedStatus.splice(index, 1);
			} else {
				self.selectedStatus.push(status);
			}
			CALENDAR.refetchEvents();
			bind.update(self);
			setItem(KEYS.SELECTED_STATUS, self.selectedStatus);
		};

		this.onTypeClick = function(event, type) {
			let index = self.selectedType.indexOf(type);
			if (type === 'All') {
				self.selectedType = [];
			} else if (index != -1) {
				self.selectedType.splice(index, 1);
			} else {
				self.selectedType.push(type);
			}
			CALENDAR.refetchEvents();
			bind.update(self);
			setItem(KEYS.SELECTED_TYPE, self.selectedType);
		};

		this.showAll = function() {
			self.selectedResource = [];
			CALENDAR.refetchEvents();
			bind.update(self);
			setItem(KEYS.SELECTED_RESOURCE, self.selectedResource);
		};

		this.showAlert = function(title, message) {
			self.alertTitle = title;
			self.alertMessage = message;
			self.alertOpen = true;
			bind.update(self);
		};

		this.closeAlert = function() {
			self.alertOpen = false;
			self.alertTitle = '';
			self.alertMessage = '';
			bind.update(self);
		};

		//* Getters

		ResourceCalendarController.getResources((result, event) => {
			if (event.status) {
				self.resources = result;
			} else {
				self.showAlert(event.type, event.message);
			}
		});

		ResourceCalendarController.getStatuses((result, event) => {
			if (event.status) {
				self.statuses = result;
			} else {
				self.showAlert(event.type, event.message);
			}
		});

	}

	//* Utilities

	function decodeHtml(html) {
		let txt = document.createElement('textarea');
		txt.innerHTML = html;
		return txt.value;
	}
	
	function getTzo(ts) {
		let date = ts ? new Date(parseInt(ts)) : new Date();
		return date.getTimezoneOffset() * 60000;
	}

	function formatDate(value, format) {
		if (!value) {
			return '';
		}
		if (!format) {
			format = 'ddd MMM D YYYY h:mm A';
		}
		return dayjs(parseInt(value)).format(format);
	}

	function getColor(status) {
		switch (status) {
			case 'None':
				return '#003f5c';
			case 'Scheduled':
				return '#58508d';
			case 'Dispatched':
				return '#ff832b';
			case 'In Progress':
				return '#f1c21b';
			case 'Cannot Complete':
				return '#da1e28';
			case 'Completed':
				return '#198038';
			case 'Canceled':
				return '#000000';
		}
	}

	function getItem(key) {
		try {
			if (localStorage !== null) {
				return JSON.parse(localStorage.getItem(key));
			} else if (sessionStorage !== null) {
				return JSON.parse(sessionStorage.getItem(key));
			}
		} catch (ignore) {}
	}

	function setItem(key, value) {
		try {
			value = JSON.stringify(value);
			if (localStorage !== null) {
				localStorage.setItem(key, value);
			} else if (sessionStorage !== null) {
				sessionStorage.setItem(key, value);
			}
		} catch (ignore) {}
	}

	//* Formatters

	rivets.formatters.formatDate = function(value, format) {
		return formatDate(value, format);
	};

	rivets.formatters.getColor = function(status) {
		return getColor(status);
	};

	//* Bind and Init

	let viewModel = new ViewModel();
	let bind = rivets.bind(document.body, viewModel);

	const CALENDAR = new FullCalendar.Calendar(ELEMENT, CONFIG);
	CALENDAR.render();

	setInterval(() => {
		CALENDAR.refetchEvents();
	}, 10 * 60 * 1000);

	// remove tooltip on document click
	$(document).on('click', () => {
		$('.tooltip').tooltip('hide');
	});

}());