import axios, {AxiosError} from 'axios';

it('test get users without auth credentials', async () => {
   const usersResp = axios.post('http://localhost:3002/api/v1/users/register', {
     name: 'hardcore',
     password: 'hardcorequal',
     email: 'hardcorequal@gmail.com',
   })
     .catch((data: AxiosError) => Promise.reject( data.response?.status ));

  await expect(usersResp).rejects.toBe(401);
});
