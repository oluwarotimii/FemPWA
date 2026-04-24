import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { staffApi } from '@/app/services/api';

export function FillPersonalDetailsScreen() {
  const { user, updateUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    emergency_contact: '',
    date_of_birth: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);

  // Wait for auth to load, then check if user is logged in
  useEffect(() => {
    if (!isLoading && !user) {
      // User is not logged in, redirect to login
      console.log('FillPersonalDetails: No user found, redirecting to login');
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Pre-fill phone if user data exists
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !user.id) {
      toast.error('User not logged in. Please log in again.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      console.log('[FillPersonalDetails] Submitting form for user ID:', user.id);
      console.log('[FillPersonalDetails] Form data:', formData);
      
      // First, check if staff record exists
      let staffRecord;
      try {
        const staffResponse = await staffApi.getCurrentUserStaffDetails();
        staffRecord = staffResponse.data?.staff;
        console.log('[FillPersonalDetails] Existing staff record:', staffRecord);
      } catch (checkError: any) {
        console.log('[FillPersonalDetails] No staff record found, will create one');
      }

      let response;
      
      if (staffRecord) {
        // Update existing staff record
        console.log('[FillPersonalDetails] Updating existing staff record');
        response = await staffApi.updateStaffProfile(user.id, {
          phone_number: formData.phone,
          current_address: formData.address,
          emergency_contact_phone: formData.emergency_contact,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender
        });
      } else {
        // Create new staff record - use POST instead
        console.log('[FillPersonalDetails] Creating new staff record');
        response = await staffApi.createStaffProfile({
          user_id: user.id,
          phone_number: formData.phone,
          current_address: formData.address,
          emergency_contact_phone: formData.emergency_contact,
          personal_email: user.email,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender
        });
      }

      console.log('[FillPersonalDetails] API response:', response);
      toast.success('Personal details updated successfully');

      // Update the user context with new information
      updateUser({
        ...user,
        phone: formData.phone
      });

      // Redirect to dashboard after successful update
      navigate('/dashboard');

      // Reset form
      setFormData({
        phone: '',
        address: '',
        emergency_contact: '',
        date_of_birth: '',
        gender: ''
      });
    } catch (error: any) {
      console.error('[FillPersonalDetails] Error:', error);
      console.error('[FillPersonalDetails] Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update personal details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {isLoading ? (
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2B3C] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      ) : !user ? (
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Redirecting to login...</p>
          </CardContent>
        </Card>
      ) : (
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Fill Personal Details</CardTitle>
          <p className="text-gray-500 text-sm">
            Please provide your personal information to complete your profile
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  name="emergency_contact"
                  type="tel"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  placeholder="Enter emergency contact"
                  required
                />
              </div>

              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A2B3C] hover:bg-[#2C3E50] text-white"
              >
                {loading ? 'Saving...' : 'Save Details'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
