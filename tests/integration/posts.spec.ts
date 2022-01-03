import axios, {AxiosRequestConfig} from 'axios';
import {nanoid} from 'nanoid';
import dotenv from 'dotenv';
import {PostType} from '../../src/routers/posts';

dotenv.config();


const host = 'http://localhost:' + process.env.SERVER_PORT;
const userHost = host + '/api/v1/users';
const postHost = host + '/api/v1/posts';

// TODO: get posts by search query (also implement this logic in route)
// TODO: admin can remove any show post
// TODO: admin don't can remove any hidden post
// TODO: simple blogger not have access to edit|remove posts what don't belong to him
// TODO: admin don't can edit any post


describe('full api posts', () => {
  const name = nanoid();
  const password = nanoid();
  const email = name + '@gmail.com';
  let config: AxiosRequestConfig = {};

  beforeAll(async () => {
    const {data} = await axios.post(userHost + '/register', {
      name,
      password,
      email,
    });
    config = {
      headers: { Authorization: `Bearer ${data.token}` },
    };
  });

  it('should get posts array', async () => {
    const {data} = await axios.get(postHost, config);
    expect(typeof data).toBe('object');
    expect(data instanceof Array).toBeTruthy();
  });
  //
  // it('should create', async () => {
  //   const {data: initialPosts} = await axios.get<PostType[]>(postHost, config);
  //
  //   const {data: createdPost} = await axios.post<PostType>(postHost, {
  //     title: nanoid(),
  //     content: 'Empty',
  //   }, config);
  //
  //   expect(createdPost.title).toBe('Some post title');
  //   const {data: postsAfterInsert} = await axios.get<PostType[]>(postHost, config);
  //   expect(postsAfterInsert.length).toBe(initialPosts.length + 1);
  // });

  it('should create & update & delete post', async () => {
    const {data: initialPosts} = await axios.get<PostType[]>(postHost, config);

    const title = nanoid();
    const content = nanoid();
    const {data: createdPost} = await axios.post<PostType>(postHost, {
      title,
      content,
    }, config);

    expect(createdPost.title).toBe(title);
    const {data: postsAfterInsert} = await axios.get<PostType[]>(postHost, config);
    expect(postsAfterInsert.length).toBe(initialPosts.length + 1);

    const newContent = nanoid();
    const {data: countEdited} = await axios.put<number>(postHost, {
      id: createdPost.id,
      content: newContent,
    }, config);
    expect(countEdited).toBe(1);

    const {data: deletedPostCount}= await axios.delete<number>(postHost, {
      ...config,
      data: {
        id: createdPost.id,
      },
    });
    expect(deletedPostCount).toBe(1);

    const {data: postsAfterRemove} = await axios.get<PostType[]>(postHost, config);
    expect(postsAfterRemove).toStrictEqual(initialPosts);
  });
});