import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

let socket = null;

export const getToken = () => AsyncStorage.getItem('token');

async function request(method, path, body) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  post: (path, body) => request('POST', path, body),
  get:  (path)       => request('GET',  path),
  put:  (path, body) => request('PUT',  path, body),
  patch:(path, body) => request('PATCH', path, body),
  del:  (path)       => request('DELETE', path),
};

export async function connectSocket(token) {
  if (socket) socket.disconnect();
  socket = io(API_URL, { auth: { token } });
  return socket;
}

export function getSocket() { return socket; }
