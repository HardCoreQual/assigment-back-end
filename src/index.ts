import dotenv from 'dotenv';
import express from 'express';
import { initSequelizeClient } from './sequelize';
import { initUsersRouter } from './routers';
import { initErrorRequestHandler, initNotFoundRequestHandler } from './middleware';
import {initPostsRouter} from './routers/posts';

dotenv.config();

async function main(): Promise<void> {
  const app = express();

  const sequelizeClient = await initSequelizeClient({
    dialect: <never>process.env.DATABASE_DIALECT,
    host: <never>process.env.DATABASE_HOST,
    port: <never>process.env.DATABASE_PORT,
    username: <never>process.env.DATABASE_USERNAME,
    password: <never>process.env.DATABASE_PASSWORD,
    database: <never>process.env.DATABASE_NAME,
  });

  app.use(express.json());

  app.use('/api/v1/users', initUsersRouter(sequelizeClient));
  app.use('/api/v1/posts', initPostsRouter(sequelizeClient));

  app.use('/', initNotFoundRequestHandler());

  app.use(initErrorRequestHandler());

  return new Promise((resolve) => {
    const PORT = <string>process.env.SERVER_PORT;
    app.listen(PORT, () => {
      console.info(`app listening on port: '${PORT}'`);

      resolve();
    });
  });
}

main().then(() => console.info('app started')).catch(console.error);