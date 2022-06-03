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
	public static List<ServiceAppointmentWrapper> getAppointments(Long startTs, Long endTs) {
    List<ServiceAppointmentWrapper> results = new List<ServiceAppointmentWrapper>();

		Datetime startTime = Datetime.newInstance(startTs);
		Datetime endTime = Datetime.newInstance(endTs);

    for (ServiceAppointment sa : [
			SELECT Id, Account.Name, AppointmentNumber, FSL__GanttLabel__c, 
        Status, toLabel(StatusCategory), WorkType.Name, OwnerId, 
        Street, City, State, PostalCode, Country, 
        ArrivalWindowStartTime, ArrivalWindowEndTime, SchedStartTime, SchedEndTime, 
				  (SELECT ServiceResourceId, ServiceResource.Name, 
            ServiceResource.FSL__GanttLabel__c, toLabel(ServiceResource.ResourceType) 
          FROM ServiceResources) 
			FROM ServiceAppointment 
			WHERE (SchedStartTime >= :startTime AND SchedEndTime <= :endTime) 
				OR (ArrivalWindowStartTime >= :startTime AND ArrivalWindowEndTime <= :endTime) 
			WITH SECURITY_ENFORCED 
      ORDER BY ArrivalWindowStartTime, SchedStartTime 
		]) {
      results.add(new ServiceAppointmentWrapper(sa));
    }

    return results;
	}

	@RemoteAction
	public static List<ResourceAbsenceWrapper> getAbsences(Long startTs, Long endTs, List<Id> resourceIds) {
    List<ResourceAbsenceWrapper> results = new List<ResourceAbsenceWrapper>();

		Datetime startTime = Datetime.newInstance(startTs);
		Datetime endTime = Datetime.newInstance(endTs);

    for (ResourceAbsence ra : [
			SELECT Id, AbsenceNumber, Start, End, Type, FSL__GanttLabel__c,
        ResourceId, Resource.Name, toLabel(Resource.ResourceType), Resource.FSL__GanttLabel__c, 
        Resource.RelatedRecord.SmallPhotoUrl, Resource.RelatedRecord.Title 
      FROM ResourceAbsence 
			WHERE (Start >= :startTime AND End <= :endTime) AND ResourceId IN :resourceIds 
			WITH SECURITY_ENFORCED
			ORDER BY Start
		]) {
      results.add(new ResourceAbsenceWrapper(ra));
    }

    return results;
	}

	@RemoteAction
	public static Map<Date, Holiday> getHolidays(Long startTs, Long endTs) {
		Datetime startDate = Datetime.newInstance(startTs);
		Datetime endDate = Datetime.newInstance(endTs);
		return HolidayUtil.getBetweenDates(startDate, endDate);
	}

	@RemoteAction
	public static List<ServiceResourceWrapper> getResources() {
    List<ServiceResourceWrapper> results = new List<ServiceResourceWrapper>();

    for (ServiceResource sr : [
			SELECT Id, Name, FSL__GanttLabel__c, FSL__Picture_Link__c, 
        toLabel(ResourceType), RelatedRecord.SmallPhotoUrl, RelatedRecord.Title 
			FROM ServiceResource 
			WHERE IsActive = true 
			WITH SECURITY_ENFORCED 
			ORDER BY Name
		]) {
      results.add(new ServiceResourceWrapper(sr));
    }

    return results;
	}

	@RemoteAction
	public static List<String> getStatuses() {
    List<String> result = new List<String>();
    Schema.DescribeFieldResult fieldResult = ServiceAppointment.StatusCategory.getDescribe();
    for (Schema.PicklistEntry ple : fieldResult.getPicklistValues()) {
      if (ple.isActive()) {
        // there is a space at the end of "Canceled"
        result.add(ple.getLabel().normalizeSpace());
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
    // deserialize ourselves because remote action will utilize strict mode (we have props that dont exist in our class)
		List<ServiceAppointmentWrapper> data = (List<ServiceAppointmentWrapper>)System.JSON.deserialize(json, List<ServiceAppointmentWrapper>.class);
		CsvBuilder builder = new CsvBuilder();
		for (ServiceAppointmentWrapper sa : data) {
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

  @TestVisible
  private class ServiceAppointmentWrapper {
    public String Id;
    public String AccountName;
    public String AppointmentNumber;
    public String Label;
    public String Status;
    public String StatusCategory;
    public String WorkTypeName;
    public String OwnerId;
    public String Street;
    public String City;
    public String State;
    public String PostalCode;
    public String Country;
    public DateTime ArrivalWindowStartTime;
    public DateTime ArrivalWindowEndTime;
    public DateTime SchedStartTime;
    public DateTime SchedEndTime;
    public List<ServiceResourceWrapper> ServiceResources;

    public ServiceAppointmentWrapper(ServiceAppointment sa) {
      this.Id = sa.Id;
      this.AccountName = sa.Account?.Name.normalizeSpace();
      this.AppointmentNumber = sa.AppointmentNumber;
      this.Label = sa.FSL__GanttLabel__c != null 
        ? sa.FSL__GanttLabel__c.normalizeSpace() 
        : (this.AccountName != null ? this.AccountName : sa.AppointmentNumber);
      this.Status = sa.Status?.normalizeSpace();
      this.StatusCategory = sa.StatusCategory?.normalizeSpace();
      this.WorkTypeName = sa.WorkType?.Name.normalizeSpace();
      this.OwnerId = sa.OwnerId;
      this.Street = sa.Street?.normalizeSpace();
      this.City = sa.City?.normalizeSpace();
      this.State = sa.State?.normalizeSpace();
      this.PostalCode = sa.PostalCode?.normalizeSpace();
      this.Country = sa.Country?.normalizeSpace();
      this.ArrivalWindowStartTime = sa.ArrivalWindowStartTime;
      this.ArrivalWindowEndTime = sa.ArrivalWindowEndTime;
      this.SchedStartTime = sa.SchedStartTime;
      this.SchedEndTime = sa.SchedEndTime;
      this.ServiceResources = new List<ServiceResourceWrapper>();
      for (AssignedResource ar : sa.ServiceResources) {
        this.ServiceResources.add(new ServiceResourceWrapper(ar));
      }
    }
  }

  @TestVisible
  private class ServiceResourceWrapper {
    public String Id;
    public String Name;
    public String Label;
    public String Photo;

    public ServiceResourceWrapper(ServiceResource sr) {
      this.Id = sr.Id;
      this.Name = sr.Name.normalizeSpace();
      this.Photo = sr.FSL__Picture_Link__c != null ? sr.FSL__Picture_Link__c : sr.RelatedRecord?.SmallPhotoUrl;      
      this.Label = sr.FSL__GanttLabel__c != null 
        ? sr.FSL__GanttLabel__c.normalizeSpace() 
        : (sr.RelatedRecord?.Title != null ? sr.RelatedRecord.Title.normalizeSpace() : sr.ResourceType?.normalizeSpace());
    }

    public ServiceResourceWrapper(AssignedResource ar) {
      this.Id = ar.ServiceResourceId;
      this.Name = ar.ServiceResource.Name.normalizeSpace();
      this.Label = ar.ServiceResource.FSL__GanttLabel__c != null 
        ? ar.ServiceResource.FSL__GanttLabel__c.normalizeSpace() 
        : ar.ServiceResource.ResourceType?.normalizeSpace();
    }
  }

  @TestVisible
  private class ResourceAbsenceWrapper {
    public String Id;
    public String AbsenceNumber;
    public String Label;
    public String Type;
    public ServiceResourceWrapper Resource;
    public DateTime StartTime;
    public DateTime EndTime;

    public ResourceAbsenceWrapper(ResourceAbsence ra) {
      this.Id = ra.Id;
      this.AbsenceNumber = ra.AbsenceNumber;
      this.Type = ra.Type?.normalizeSpace();
      this.Label = ra.FSL__GanttLabel__c != null 
        ? ra.FSL__GanttLabel__c 
        : this.Type;
      this.Resource = new ServiceResourceWrapper(ra.Resource);
      this.StartTime = ra.Start;
      this.EndTime = ra.End;
    }
  }

}
