import axiosClient from '../../config/axiosClient';

export const NganHangService = {
    getAll: () => axiosClient.get('/ngan-hang'),
    // Chỉ cần truyền FormData vào, không cần cấu hình gì thêm
    create: (formData) => axiosClient.post('/ngan-hang', formData),
    update: (id, formData) => axiosClient.put(`/ngan-hang/${id}`, formData),
    delete: (id) => axiosClient.delete(`/ngan-hang/${id}`)
};