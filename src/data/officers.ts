export const HPCL_OFFICERS = [
  { id: 'off_1', name: 'Rohan Sharma', region: 'Nagpur, MH', phone: '+919988776655' },
  { id: 'off_2', name: 'Amit Das', region: 'Kolkata, WB', phone: '+918877665544' },
  { id: 'off_3', name: 'Suresh Reddy', region: 'Visakhapatnam, AP', phone: '+917766554433' },
  { id: 'off_4', name: 'Priya Patel', region: 'Ahmedabad, GJ', phone: '+916655443322' },
  { id: 'off_5', name: 'Vikram Singh', region: 'Jamshedpur, JH', phone: '+915544332211' }
];

// Logic to find the right officer for a lead's location
export function getAssignedOfficer(location: string) {
  const match = HPCL_OFFICERS.find(officer => location.includes(officer.region.split(',')[0]));
  return match || { name: 'Central Sales Hub', region: 'National', phone: 'N/A' };
}