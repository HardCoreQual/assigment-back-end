import {SequelizeClient} from '../sequelize';
import {RequestHandler, Router} from 'express';
import {initTokenValidationRequestHandler, RequestAuth} from '../middleware';
import {Op} from 'sequelize';
import {UserType} from '../constants';
import {BadRequestError, HttpError} from '../errors';


export const initPostsRouter = (sequelizeClient: SequelizeClient): Router  => {
  const router = Router({ mergeParams: true });

  const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);

  router.route('/')
    .get(tokenValidation, initListPostsRequestHandler(sequelizeClient))
    .post(tokenValidation, initCreatePostRequestHandler(sequelizeClient))
    .put(tokenValidation, initEditPostRequestHandler(sequelizeClient))
    .delete(tokenValidation, initDeletePostRequestHandler(sequelizeClient));
  return router;
};

const initListPostsRequestHandler = (sequelizeClient: SequelizeClient) : RequestHandler => {
  return async (req, res, next) => {
    const { auth: { user } } = req as unknown as { auth: RequestAuth };
    const { models } = sequelizeClient;
    const isAdmin = user.type === UserType.ADMIN;

    try {
      const posts = await models.posts.findAll({
        where: {
          [Op.or]: [
            {is_hidden: isAdmin || false},
            {authorId: user.id},
          ],
        },
      });

      res.json(posts).end();
    } catch (e) {
      next(new HttpError('INTERNAL_ERROR'));
    }
  };
};


const initCreatePostRequestHandler = (sequelizeClient: SequelizeClient) : RequestHandler => {
  return async (req, res, next) => {
    const { auth: { user: { id: userId } } } = req as unknown as { auth: RequestAuth };
    const { models } = sequelizeClient;

    const { content, title, isHidden } = req.body as { title?: string, content?: string, isHidden ?: boolean };
    if (!title) {
      next(new BadRequestError('EMPTY_POST_TITLE'));
      return;
    }

    try {
      const posts = await models.posts.create({
        title: title,
        content: content || '',
        isHidden: isHidden !== undefined ? isHidden : true,
        authorId: userId,
      });

      res.json(posts).end();
    } catch (e) {
      next(new HttpError('INTERNAL_ERROR'));
    }
  };
};

const initEditPostRequestHandler = (sequelizeClient: SequelizeClient) : RequestHandler => {
  return async (req, res, next) => {
    const { auth: { user: { id: userId } } } = req as unknown as { auth: RequestAuth };
    const { models } = sequelizeClient;

    const { content, title, isHidden, id } = req.body as { id?: string, title?: string, content?: string, isHidden ?: boolean };
    if (!id) {
      next(new BadRequestError('MISSING_POST_ID'));
      return;
    }

    try {
      const posts = await models.posts.update({
        title: title,
        content: content,
        isHidden: isHidden,
      }, {
        where: {
          id: id,
          authorId: userId,
        },
      });

      res.json(posts).end();
    } catch (e) {
      next(new HttpError('INTERNAL_ERROR'));
    }
  };
};


const initDeletePostRequestHandler = (sequelizeClient: SequelizeClient) : RequestHandler => {
  return async (req, res, next) => {
    const { auth: { user: { id: userId, type } } } = req as unknown as { auth: RequestAuth };
    const { models } = sequelizeClient;

    const { id } = req.body as { id?: string };
    if (!id) {
      next(new BadRequestError('MISSING_POST_ID'));
      return;
    }

    const isAdmin = type === UserType.ADMIN;

    try {
      const posts = await models.posts.destroy({
        where: {
          id: id,
          [Op.or]: [
            ...(isAdmin ? [] : [{is_hidden: false}]),
            {authorId: userId},
          ],
        },
      });

      res.json(posts).end();
    } catch (e) {
      next(new HttpError('INTERNAL_ERROR'));
    }
  };
};
