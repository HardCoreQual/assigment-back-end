import axios, {AxiosError} from 'axios';

it('test get users without auth credentials', async () => {
   const usersResp = axios.get('http://localhost:3002/api/v1/users')
     .catch((data: AxiosError) => Promise.reject( data.response?.status ));

  await expect(usersResp).rejects.toBe(401);
});
