import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 10000,
});

export const importEnterprises = () => {
    return instance.post('/scan-enterprises');
};
