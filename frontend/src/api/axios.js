import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://apprecipe-backend.onrender.com/api',
});

export default instance;