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
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    emergency_contact: '',
    date_of_birth: '',
    gender: '',
    department: '',
    position: '',
    employment_date: ''
  });
  const [loading, setLoading] = useState(false);

  // Pre-fill form if user data exists
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        phone: user.phone || '',
        department: user.department || '',
        position: user.designation || ''
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
    
    setLoading(true);
    try {
      // Call the API to update staff profile
      const response = await staffApi.updateStaffProfile(user!.id, {
        phone: formData.phone,
        address: formData.address,
        emergency_contact: formData.emergency_contact
      });

      toast.success('Personal details updated successfully');

      // Update the user context with new information
      updateUser({
        ...user!,
        phone: formData.phone,
        department: formData.department,
        designation: formData.position
      });

      // Redirect to dashboard after successful update
      navigate('/dashboard');
      
      // Reset form
      setFormData({
        phone: '',
        address: '',
        emergency_contact: '',
        date_of_birth: '',
        gender: '',
        department: '',
        position: '',
        employment_date: ''
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update personal details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter department"
                />
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Enter position"
                />
              </div>

              <div>
                <Label htmlFor="employment_date">Employment Start Date</Label>
                <Input
                  id="employment_date"
                  name="employment_date"
                  type="date"
                  value={formData.employment_date}
                  onChange={handleChange}
                />
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
    </div>
  );
}