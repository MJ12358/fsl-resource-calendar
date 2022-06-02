/* global
  $
  userId
  dayjs
  rivets
  FullCalendar
  ResourceCalendarController
*/

/* eslint
  no-unused-vars: "warn",
  no-empty: "off"
*/

(function() {
	'use strict';

  //* Sources (need this before Config)

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
				}, { escape: false }
			);
		},
		failure: function(event) {
			viewModel.showAlert(event.type, event.message);
		},
		eventDataTransform: function(record) {
      // filter by service resource
			if (viewModel.selectedResources.length > 0) {
        if (!record.ServiceResources) {
          return false;
        }
				let arr = record.ServiceResources.filter(v => viewModel.selectedResources.includes(v.Id));
				if (arr.length === 0) {
					return false;
				}
			}
      // filter by status
      if (viewModel.selectedStatuses.length > 0) {
        if (!record.StatusCategory) {
          return false;
        }
        if (!viewModel.selectedStatuses.includes(record.StatusCategory)) {
          return false;
        }
      }
      // filter by work type
      if (viewModel.selectedWorkTypes.length > 0) {
        if (!record.WorkTypeName) {
          return false;
        }
        if (!viewModel.selectedWorkTypes.includes(record.WorkTypeName)) {
          return false;
        }
      }
      // filter by owner
      if (viewModel.ownerId) {
        if (!record.OwnerId) {
          return false;
        }
        if (viewModel.ownerId !== record.OwnerId) {
          return false;
        }
      }
      // filter by search value
      if (viewModel.searchValue) {
        if (!record.Label?.toLowerCase().includes(viewModel.searchValue.toLowerCase())) {
          return false;
        }
      }
			return new Appointment(record);
		}
	};

	let absenceSource = {
		id: 'absenses',
		color: '#999999',
		display: 'block',
		events: function(info, onSuccess, onFailure) {
			if (viewModel.selectedResources.length === 0) {
				onSuccess([]);
				return;
			}
			ResourceCalendarController.getAbsences(
				info.start.getTime(),
				info.end.getTime(),
				viewModel.selectedResources,
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

  //* Config

  const KEYS = {
    SELECTED_OWNER: 'vf.resourceCalendar.selectedOwner',
		SELECTED_RESOURCES: 'vf.resourceCalendar.selectedResources',
		SELECTED_STATUSES: 'vf.resourceCalendar.selectedStatuses',
		SELECTED_WORKTYPES: 'vf.resourceCalendar.selectedWorkTypes'
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
		this.color = getColor(record.StatusCategory);
		this.title = decodeHtml(record.Label);
		this.extendedProps = Object.assign(this.extendedProps || {}, record);
    this.tooltip = getTooltip({
      'Number': record.AppointmentNumber,
      'Status': record.Status,
      'Work Type': record.WorkTypeName,
      'Account': record.AccountName,
      'Address': getAddress(),
      'Start': formatDate(record.SchedStartTime || record.ArrivalWindowStartTime),
      'End': formatDate(record.SchedEndTime || record.ArrivalWindowEndTime),
    }) + getResources();
		
    function getAddress() {
      let arr = [record.Street, record.City, record.State, record.PostalCode, record.Country];
      return arr.filter(e => e).join(', ');
    }

    function getResources() {
			let result = '';
			if (!record.ServiceResources || record.ServiceResources.length <= 0) {
				return result;
			}
			record.ServiceResources.forEach(v => {
				result += `${v.Name} - ${v.Label}<br>`;
			});
			return result;
		}
	}

	function Absence(record) {
		this.id = record.Id;
		this.start = record.StartTime;
		this.end = record.EndTime;
		this.title = decodeHtml(record.Label);
		this.extendedProps = Object.assign(this.extendedProps || {}, record);
    this.tooltip = getTooltip({
      'Number': record.AbsenceNumber,
      'Type': record.Type,
      'Resource': `${record.Resource.Name} - ${record.Resource.Label}`,
      'Start': formatDate(record.StartTime),
      'End': formatDate(record.EndTime),
    });
	}

	//* Full Calendar Events

	function onViewMount() {
		// move extras into the toolbar
		let workTypeSelect = document.getElementById('worktype-selector');
		ELEMENT.querySelector('.fc-header-toolbar .fc-toolbar-chunk:first-of-type').appendChild(workTypeSelect);
    let searchBar = document.getElementById('search-bar');
		ELEMENT.querySelector('.fc-header-toolbar .fc-toolbar-chunk:last-of-type .btn-group').prepend(searchBar);
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
      sanitize: false,
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
		let data = CALENDAR.getEvents()
			.filter(v => v.source.id === 'appointments')
			.reduce((a, c) => {
				// SF dosent like relationships sent back to it without proper formatting so just filter them out
				let r = Object.fromEntries(
					Object.entries(c.extendedProps).filter(function([, value]) {
            return (typeof value === 'string' || typeof value === 'number');
          })
				);
        // VF remoting cannot deserialize long to datetime
        for (let [key, value] of Object.entries(r)) {
          if (key.includes('Time')) {
            r[key] = new Date(value).toISOString();
          }
        }
				a.push(r);
				return a;
			}, []);
		ResourceCalendarController.exportToCsv(JSON.stringify(data), (result, event) => {
			if (event.status) {
				let a = document.createElement('a');
				// this does not work for lengthly csv's
				a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(result);
				a.target = '_blank';
				a.download = 'ServiceAppointment_Export.csv';
				a.click();
				a.remove();
			} else {
				viewModel.showAlert(event.type, event.message);
			}
		}, { escape: false });
	}

	//* View Model

	function ViewModel() {
		const self = this;

		this.alertOpen = false;
		this.alertTitle = '';
		this.alertMessage = '';

    this.ownerId = getItem(KEYS.SELECTED_OWNER) || '';
		this.resources = [];
		this.selectedResources = getItem(KEYS.SELECTED_RESOURCES) || [];
		this.selectedStatuses = getItem(KEYS.SELECTED_STATUSES) || [];
		this.selectedWorkTypes = getItem(KEYS.SELECTED_WORKTYPES) || [];
		this.statuses = [];
		this.workTypes = [];
    this.searchValue = '';

		this.onResourceClick = function(event, resourceId) {
			let foundResource = self.resources.find(a => a.Id === resourceId);
			let index = self.selectedResources.indexOf(foundResource.Id);
			if (index != -1) {
				self.selectedResources.splice(index, 1);
			} else {
				self.selectedResources.push(foundResource.Id);
			}
			CALENDAR.refetchEvents();
			bind.update(self);
			setItem(KEYS.SELECTED_RESOURCES, self.selectedResources);
		};

		this.onStatusClick = function(event, status) {
			let index = self.selectedStatuses.indexOf(status);
			if (index != -1) {
				self.selectedStatuses.splice(index, 1);
			} else {
				self.selectedStatuses.push(status);
			}
			CALENDAR.refetchEvents();
			bind.update(self);
			setItem(KEYS.SELECTED_STATUSES, self.selectedStatuses);
		};

		this.onWorkTypeClick = function(event, type) {
			let index = self.selectedWorkTypes.indexOf(type);
			if (type === 'All') {
				self.selectedWorkTypes = [];
			} else if (index != -1) {
				self.selectedWorkTypes.splice(index, 1);
			} else {
				self.selectedWorkTypes.push(type);
			}
			CALENDAR.refetchEvents();
			bind.update(self);
			setItem(KEYS.SELECTED_WORKTYPES, self.selectedWorkTypes);
		};

		this.showAll = function() {
			self.selectedResources = [];
      self.ownerId = '';
			CALENDAR.refetchEvents();
			bind.update(self);
      setItem(KEYS.SELECTED_OWNER, self.ownerId);
			setItem(KEYS.SELECTED_RESOURCES, self.selectedResources);
		};

    this.showMine = function() {
      if (self.ownerId) {
        self.ownerId = '';
      } else {
        self.ownerId = userId;
      }
      CALENDAR.refetchEvents();
      bind.update(self);
      setItem(KEYS.SELECTED_OWNER, self.ownerId);
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

    this.onSearch = function() {
      CALENDAR.refetchEvents();
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

    ResourceCalendarController.getWorkTypes((result, event) => {
      if (event.status) {
        self.workTypes = result;
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

  function getTooltip(object) {
    let result = '<table>';
    for (let [key, value] of Object.entries(object)) {
      if (!key || !value) {
        continue;
      }
      result += `<tr>`;
      result += `<th>${key}</th>`;
      result += `<td>${value}</td>`;
      result += `</tr>`;
    }
    result += `</table>`;
    return result;
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

  //* Initialize

  let viewModel = new ViewModel();

  const CALENDAR = new FullCalendar.Calendar(ELEMENT, CONFIG);
	CALENDAR.render();

	//* Formatters

	rivets.formatters.formatDate = function(value, format) {
		return formatDate(value, format);
	};

	rivets.formatters.getColor = function(status) {
		return getColor(status);
	};

  rivets.binders.keyupdelay.callback = viewModel.onSearch;

	//* Bind

	let bind = rivets.bind(document.body, viewModel);

	setInterval(() => {
		CALENDAR.refetchEvents();
	}, 5 * 60 * 1000);

	// remove tooltip on document click
	$(document).on('click', () => {
		$('.tooltip').tooltip('hide');
	});

}());