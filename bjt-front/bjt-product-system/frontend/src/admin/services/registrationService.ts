import apiService from '../../services/apiService';

export const getPendingRegs = async () => {
  const res = await apiService.get('/phase2/admin/registrations?status=pending');
  return res;
};

export const approveReg = async (id: number, data: any) => {
  return apiService.post(`/phase2/admin/registrations/${id}/approve`, data);
};

export const rejectReg = async (id: number, reason: string) => {
  return apiService.post(`/phase2/admin/registrations/${id}/reject`, { reason });
}; 