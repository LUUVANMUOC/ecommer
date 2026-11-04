import axiosClient from '../../config/axiosClient';

export const xaService = {
    getAll: () => axiosClient.get('/xa'),
    create: (data) => axiosClient.post('/xa', data),
    update: (id, data) => axiosClient.put(`/xa/${id}`, data),
    delete: (id) => axiosClient.delete(`/xa/${id}`)
};