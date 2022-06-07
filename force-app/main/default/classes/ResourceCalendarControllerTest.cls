@IsTest
public class ResourceCalendarControllerTest {

  private static DateTime now {
    get {
      if (now == null) {
        now = Datetime.now();
      }
      return now;
    }
    set;
  }
  private static DateTime startTime = now.addHours(-1);
  private static DateTime endTime = now.addHours(1);
  private static DateTime schedStart = now.addMinutes(-30);
  private static DateTime schedEnd = endTime.addMinutes(-15);

  @TestSetup
  static void testSetup() {
    Account acc = new Account();
    acc.Name = 'Test Company';
    insert acc;

    User usr = new User();
    usr.IsActive = true;
    usr.LastName = 'test';
    usr.Email = 'resource_calendar@test.com';
    usr.Alias = 'rctest';
    usr.LocaleSidKey = 'en_US';
    usr.EmailEncodingKey = 'UTF-8';
    usr.LanguageLocaleKey = 'en_US';
    usr.ProfileId = System.UserInfo.getProfileId();
    usr.TimeZoneSidKey = System.UserInfo.getTimeZone().getID();
    usr.Username = 'resource_calendar@test.com';
    insert usr;

    ServiceResource sr = new ServiceResource();
    sr.IsActive = true;
    sr.Name = usr.Alias;
    sr.RelatedRecordId = usr.Id;
    insert sr;

    ServiceAppointment sa = new ServiceAppointment();
    sa.ParentRecordId = acc.Id;
    sa.DueDate = Datetime.now().addDays(7);
    sa.EarliestStartTime = Datetime.now().addDays(-7);
    sa.ArrivalWindowStartTime = schedStart;
    sa.ArrivalWindowEndTime = schedEnd;
    sa.SchedStartTime = schedStart;
    sa.SchedEndTime = schedEnd;
    insert sa;

    OperatingHours oh = new OperatingHours();
    oh.Name = 'Operating Hours';
    insert oh;

    ServiceTerritory st = new ServiceTerritory();
    st.IsActive = true;
    st.Name = 'Service Territory';
    st.OperatingHoursId = oh.Id;
    insert st;

    ServiceTerritoryMember stm = new ServiceTerritoryMember();
    stm.ServiceResourceId = sr.Id;
    stm.ServiceTerritoryId = st.Id;
    stm.EffectiveStartDate = Datetime.now().addDays(-7);
    insert stm;

    AssignedResource ar = new AssignedResource();
    ar.ServiceAppointmentId = sa.Id;
    ar.ServiceResourceId = sr.Id;
    insert ar;

    ResourceAbsence ra = new ResourceAbsence();
    ra.ResourceId = sr.Id;
    ra.Start = schedStart;
    ra.End = schedEnd;
    insert ra;
  }

  @IsTest
  static void testGetAppointments() {
    Test.startTest();
    List<ResourceCalendarController.ServiceAppointmentWrapper> results = 
      ResourceCalendarController.getAppointments(startTime.getTime(), endTime.getTime());
    Test.stopTest();
    System.assertNotEquals(null, results);
  }

  @IsTest
  static void testGetAbsences() {
    ServiceResource sr = [SELECT Id FROM ServiceResource LIMIT 1];

    Test.startTest();
    List<ResourceCalendarController.ResourceAbsenceWrapper> results = 
      ResourceCalendarController.getAbsences(startTime.getTime(), endTime.getTime(), new List<Id>{sr.Id});
    Test.stopTest();
    System.assertNotEquals(null, results);
  }

  @IsTest
  static void testGetHolidays() {
    Test.startTest();
    Map<Date, Holiday> results = 
      ResourceCalendarController.getHolidays(startTime.getTime(), endTime.getTime());
    Test.stopTest();
    System.assertNotEquals(null, results);
  }

  @IsTest
  static void testGetResources() {
    Test.startTest();
    List<ResourceCalendarController.ServiceResourceWrapper> results = 
      ResourceCalendarController.getResources();
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
  static void testGetWorkTypes() {
    Test.startTest();
    List<WorkType> results = ResourceCalendarController.getWorkTypes();
    Test.stopTest();
    System.assertNotEquals(null, results);
  }

  @IsTest
  static void testExportToCsv() {
    List<ResourceCalendarController.ServiceAppointmentWrapper> wrapper = 
      ResourceCalendarController.getAppointments(startTime.getTime(), endTime.getTime());

    Test.startTest();
    String result = ResourceCalendarController.exportToCsv(System.JSON.serialize(wrapper));
    Test.stopTest();
    System.assertNotEquals(null, result);
  }

}
