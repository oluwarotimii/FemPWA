import { useState, useEffect } from 'react';
import { Calendar, Info, Clock, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { holidayApi, type Holiday, type HolidayDutyRoster } from '@/app/services/api/holidayApi';
import { toast } from 'sonner';

export function HolidaysScreen() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [myDuties, setMyDuties] = useState<HolidayDutyRoster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch holidays - handle 403 permission errors gracefully
      try {
        const holidaysRes = await holidayApi.getHolidays();
        setHolidays(holidaysRes.data.holidays || []);
      } catch (holidaysError: any) {
        if (holidaysError.response?.status === 403) {
          console.log('No permission to view holidays');
          setHolidays([]);
        } else {
          console.error('Failed to fetch holidays:', holidaysError);
          setHolidays([]);
        }
      }
      
      // Fetch duty roster - handle 403 permission errors gracefully
      try {
        const dutiesRes = await holidayApi.getMyHolidayDuty();
        setMyDuties(dutiesRes.data.rosters || []);
      } catch (dutiesError: any) {
        if (dutiesError.response?.status === 403) {
          console.log('No duty roster assignments');
          setMyDuties([]);
        } else {
          console.error('Failed to fetch duty roster:', dutiesError);
          setMyDuties([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch holiday data:', error);
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const isUserOnDuty = (holidayId: number) => {
    return myDuties.find(d => d.holiday_id === holidayId);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRosterTime = (timeStr: string) => {
    return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Holidays & Duty</h1>
          <p className="text-sm text-gray-500">Upcoming holidays and assigned duties</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A2B3C]"></div>
            <p className="mt-4 text-gray-500">Loading schedule...</p>
          </div>
        ) : holidays.length === 0 && myDuties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Information Available</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Holiday and duty roster information is not available for your account.
            </p>
          </div>
        ) : (
          <>
            {/* Duty Roster Section */}
            {myDuties.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Your Holiday Duties
                </h2>
                {myDuties.map((duty) => (
                  <Card key={duty.id} className="border-l-4 border-blue-600 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">{duty.holiday_name || 'Holiday Duty'}</h3>
                          <p className="text-sm text-gray-500">{duty.holiday_date ? formatDate(duty.holiday_date) : ''}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">On Duty</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{formatRosterTime(duty.shift_start_time)} - {formatRosterTime(duty.shift_end_time)}</span>
                        </div>
                      </div>
                      {duty.notes && (
                        <p className="mt-2 text-xs text-gray-500 italic">Note: {duty.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Upcoming Holidays Section */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#1A2B3C]" />
                Upcoming Holidays
              </h2>
              {holidays.length > 0 ? (
                holidays.map((holiday) => {
                  const duty = isUserOnDuty(holiday.id);
                  return (
                    <Card key={holiday.id} className={`shadow-sm overflow-hidden ${duty ? 'ring-1 ring-blue-200' : ''}`}>
                      <CardContent className="p-0">
                        <div className={`p-4 ${holiday.is_mandatory ? 'bg-gradient-to-r from-red-50 to-transparent' : 'bg-gradient-to-r from-gray-50 to-transparent'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">{holiday.holiday_name}</h3>
                                {holiday.is_mandatory && (
                                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none h-5 text-[10px]">Mandatory</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{formatDate(holiday.date)}</p>
                            </div>
                            {duty && (
                              <Badge className="bg-blue-600 text-white">Assigned Duty</Badge>
                            )}
                          </div>
                        </div>
                        {holiday.description && (
                          <div className="p-4 pt-0">
                            <div className="flex items-start gap-2 bg-white rounded-lg p-2 border border-gray-100">
                              <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-gray-500 leading-relaxed">{holiday.description}</p>
                            </div>
                          </div>
                        )}
                        {!holiday.is_mandatory && !duty && (
                          <div className="px-4 pb-4 flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Public Holiday - No work</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-gray-500">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>No upcoming holidays found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
