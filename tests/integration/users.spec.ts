import axios, {AxiosError} from 'axios';
import {nanoid} from 'nanoid';
import dotenv from 'dotenv';

dotenv.config();


const host = 'http://localhost:' + process.env.SERVER_PORT;
const userHost = host + '/api/v1/users';

// TODO: not possible login with not matched password
// TODO: not possible register with invalid name, email, password

it('failed login to unregistered user', async () => {
  const name = nanoid();
  const password = nanoid();
  const email = name + '@gmail.com';

  await axios.post(userHost + '/login', {
    name, password,
  }).catch((e: AxiosError) => {
    expect(e.response?.status).toBe(401);
  });

  const register = await axios.post(userHost + '/register', {
    name,
    password,
    email,
  });
  expect(register.data.token).not.toBeUndefined();

  const login = await axios.post(userHost + '/login', {
    email, password,
  });
  expect(login.data.token).not.toBeUndefined();
});
