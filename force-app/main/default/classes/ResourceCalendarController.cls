/**
 * Created on Thu Jul 01 2021
 *
 * Copyright (c) 2021 Matt T. Jants
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, 
 *    are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, 
 *    this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice, 
 *    this list of conditions and the following disclaimer in the documentation 
 *    and/or other materials provided with the distribution.
 * - Neither the name of the company, software or the names of its contributors 
 *    may be used to endorse or promote products derived from this software without 
 *    specific prior written permission.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 *  TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 *  THE COPYRIGHT HOLDERS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 *  OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 *  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, TORT (INCLUDING NEGLIGENCE) OR OTHERWISE, 
 *  ARISING FROM, OUT OF OR IN CONNECTION WITH THE USE OF THIS SOFTWARE OR OTHER DEALINGS IN THE SOFTWARE, 
 *  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **/

public with sharing class ResourceCalendarController {

  @RemoteAction
	public static List<ServiceAppointment> getAppointments(Long startTs, Long endTs) {
		Datetime startTime = Datetime.newInstance(startTs);
		Datetime endTime = Datetime.newInstance(endTs);
		return [
			SELECT Id, Account.Name, AppointmentNumber, SchedStartTime, SchedEndTime, Status, 
				ArrivalWindowStartTime, ArrivalWindowEndTime, FSL__GanttLabel__c, 
				Street, City, State, PostalCode, WorkType.Name, OwnerId, 
				(SELECT Id, ServiceResourceId, ServiceResource.Name, ServiceResource.FSL__GanttLabel__c FROM ServiceResources)
			FROM ServiceAppointment 
			WHERE (SchedStartTime >= :startTime AND SchedEndTime <= :endTime) 
				OR (ArrivalWindowStartTime >= :startTime AND ArrivalWindowEndTime <= :endTime) 
			WITH SECURITY_ENFORCED 
      ORDER BY SchedStartTime, ArrivalWindowStartTime
		];
	}

	@RemoteAction
	public static List<ResourceAbsence> getAbsences(Long startTs, Long endTs, List<Id> resourceIds) {
		Datetime startTime = Datetime.newInstance(startTs);
		Datetime endTime = Datetime.newInstance(endTs);
		return [
			SELECT Id, AbsenceNumber, Description, Type, Start, End, ResourceId, Resource.Name, FSL__GanttLabel__c FROM ResourceAbsence 
			WHERE (Start >= :startTime AND End <= :endTime) AND ResourceId IN :resourceIds 
			WITH SECURITY_ENFORCED
			ORDER BY Start
		];
	}

	@RemoteAction
	public static Map<Date, Holiday> getHolidays(Long startTs, Long endTs) {
		Datetime startDate = Datetime.newInstance(startTs);
		Datetime endDate = Datetime.newInstance(endTs);
		return HolidayUtil.getBetweenDates(startDate, endDate);
	}

	@RemoteAction
	public static List<ServiceResource> getResources() {
		return [
			SELECT Id, Name, FSL__GanttLabel__c, RelatedRecord.SmallPhotoUrl, RelatedRecord.Title, ResourceType 
			FROM ServiceResource 
			WHERE IsActive = true 
			WITH SECURITY_ENFORCED 
			ORDER BY Name
		];
	}

	@RemoteAction
	public static List<String> getStatuses() {
    List<String> result = new List<String>();
    Schema.DescribeFieldResult fieldResult = ServiceAppointment.Status.getDescribe();
    for (Schema.PicklistEntry ple : fieldResult.getPicklistValues()) {
      if (ple.isActive()) {
        result.add(ple.getLabel());
      }
    }
    return result;
	}

  @RemoteAction
  public static List<WorkType> getWorkTypes() {
    return [
      SELECT Id, Name 
      FROM WorkType 
      WITH SECURITY_ENFORCED 
      ORDER BY Name
    ];
  }

	@RemoteAction
	public static String exportToCsv(String json) {
		List<ServiceAppointment> data = (List<ServiceAppointment>)System.JSON.deserialize(json, List<ServiceAppointment>.class);
		CsvBuilder builder = new CsvBuilder();
		for (ServiceAppointment sa : data) {
			Map<String, Object> row = (Map<String, Object>)System.JSON.deserializeUntyped(System.JSON.serialize(sa));
			for (String key : row.keySet()) {
        Object value = row.get(key);
				if (value != null && value instanceof String) {
					builder.appendField(key, value);
				}
			}
			builder.newRow();
		}
		return builder.toString();
	}

}
