import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://apprecipe.onrender.com/api',
});

export default instance;
