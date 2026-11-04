import axiosClient from '../../config/axiosClient';

export const tinhService = {
    getAll: () => axiosClient.get('/tinh'),
    create: (data) => axiosClient.post('/tinh', data),
    update: (id, data) => axiosClient.put(`/tinh/${id}`, data),
    delete: (id) => axiosClient.delete(`/tinh/${id}`)
};