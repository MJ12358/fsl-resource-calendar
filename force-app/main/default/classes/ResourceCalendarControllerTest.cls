@IsTest
public class ResourceCalendarControllerTest {

	private static Datetime startTime = Datetime.now();
	private static Datetime endTime = Datetime.now().addHours(1);

	@IsTest
	static void testGetAppointments() {
		Test.startTest();
		List<ServiceAppointment> results = ResourceCalendarController.getAppointments(startTime.getTime(), endTime.getTime());
		Test.stopTest();
		System.assertNotEquals(null, results);
	}

	@IsTest
	static void testGetAbsences() {
		Test.startTest();
		List<ResourceAbsence> results = ResourceCalendarController.getAbsences(startTime.getTime(), endTime.getTime(), new List<Id>());
		Test.stopTest();
		System.assertNotEquals(null, results);
	}

	@IsTest
	static void testGetHolidays() {
		Test.startTest();
		Map<Date, Holiday> results = ResourceCalendarController.getHolidays(startTime.getTime(), endTime.getTime());
		Test.stopTest();
		System.assertNotEquals(null, results);
	}

	@IsTest
	static void testGetResources() {
		Test.startTest();
		List<ServiceResource> results = ResourceCalendarController.getResources();
		Test.stopTest();
		System.assertNotEquals(null, results);
	}

	@IsTest
	static void testGetStatuses() {
		Test.startTest();
		List<String> results = ResourceCalendarController.getStatuses();
		Test.stopTest();
		System.assertNotEquals(null, results);
	}

	@IsTest
	static void testExportToCsv() {
		List<ServiceAppointment> saList = [SELECT Id FROM ServiceAppointment];
		Test.startTest();
		String result = ResourceCalendarController.exportToCsv(System.JSON.serialize(saList));
		Test.stopTest();
		System.assertNotEquals(null, result);
	}

}
