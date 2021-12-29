import {RequestHandler, Router} from 'express';
import {Op} from 'sequelize';
import { hash } from 'bcrypt';

import type {SequelizeClient} from '../sequelize';
import type {User} from '../repositories/types';

import {BadRequestError, UnauthorizedError} from '../errors';
import {generateToken, passwordCoincideWithHash} from '../security';
import {initAdminValidationRequestHandler, initTokenValidationRequestHandler, RequestAuth} from '../middleware/security';
import {UserType} from '../constants';

export function initUsersRouter(sequelizeClient: SequelizeClient): Router {
  const router = Router({ mergeParams: true });

  const tokenValidation = initTokenValidationRequestHandler(sequelizeClient);
  const adminValidation = initAdminValidationRequestHandler();

  router.route('/')
    .get(tokenValidation, initListUsersRequestHandler(sequelizeClient))
    .post(tokenValidation, adminValidation, initCreateUserRequestHandler(sequelizeClient));

  router.route('/login')
    .post(tokenValidation, initLoginUserRequestHandler(sequelizeClient));
  router.route('/register')
    .post(initRegisterUserRequestHandler(sequelizeClient));

  return router;
}

function initListUsersRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function listUsersRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      const { auth: { user: { type: userType } } } = req as unknown as { auth: RequestAuth };

      const isAdmin = userType === UserType.ADMIN;

      const users = await models.users.findAll({
        attributes: isAdmin ? ['id', 'name', 'email'] : ['name', 'email'],
        ...(isAdmin ? {} : { where: { type: { [Op.ne]: UserType.ADMIN } } }),
        raw: true,
      });

      res.send(users);

      return res.end();
    } catch (error) {
      next(error);
    }
  };
}

function initCreateUserRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function createUserRequestHandler(req, res, next): Promise<void> {
    const { type, name, email, password } = req.body as CreateUserData;

    if (checkUserRegisterParams({name, email, password})) {
      next(new BadRequestError('INVALID_PARAMS'));
      return;
    }
    if (!Object.values(UserType).includes(type)) {
      next(new BadRequestError('Unknown UserType'));
      return;
    }

    try {
      await createUser({ type, name, email, password }, sequelizeClient);

      return res.status(204).end();
    } catch (error) {
      next(error);
    }
  };
}

function initLoginUserRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function loginUserRequestHandler(req, res, next): Promise<void> {
    const { models } = sequelizeClient;

    try {
      // NOTE(roman): missing validation and cleaning
      const { email, password } = req.body as { name: string; email: string; password: string };

      const user = await models.users.findOne({
        attributes: ['id', 'passwordHash'],
        where: { email },
        raw: true,
      }) as Pick<User, 'id' | 'passwordHash'> | null;
      if (!user) {
        throw new UnauthorizedError('EMAIL_OR_PASSWORD_INCORRECT');
      }

      if (await passwordCoincideWithHash(password, user.passwordHash)) {
        throw new UnauthorizedError('EMAIL_OR_PASSWORD_INCORRECT');
      }

      const token = generateToken({ id: user.id });

      return res.send({ token }).end();
    } catch (error) {
      next(error);
    }
  };
}

type UserRegisterParams = Omit<CreateUserData, 'type'>;

const notNullKeys = (data: Record<string, unknown>, keys: string[]) => {
  return Object
    .keys(data)
    .filter(key => !keys.includes(key))
    .length === 0;
};

const regexEmail = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

const checkUserRegisterParams = (params: UserRegisterParams) => {
  return notNullKeys(params, ['email', 'password', 'name'])
    && params.email.match(regexEmail)
    && params.password.length > 9;
};


function initRegisterUserRequestHandler(sequelizeClient: SequelizeClient): RequestHandler {
  return async function createUserRequestHandler(req, res, next): Promise<void> {
    const { name, email, password } = req.body as UserRegisterParams;
    if (!checkUserRegisterParams({name, email, password})) {
      next(new BadRequestError('INVALID_PARAMS'));
      return;
    }

    try {
      await createUser({ type: UserType.BLOGGER, name, email, password }, sequelizeClient);

      return res.status(204).end();
    } catch (error) {
      next(error);
    }
  };
}

async function createUser(data: CreateUserData, sequelizeClient: SequelizeClient): Promise<void> {
  const { type, name, email, password } = data;

  const { models } = sequelizeClient;

  const similarUser = await models.users.findOne({
    attributes: ['id', 'name', 'email'],
    where: {
      [Op.or]: [
        { name },
        { email },
      ],
    },
    raw: true,
  }) as Pick<User, 'id' | 'name' | 'email'> | null;
  if (similarUser) {
    if (similarUser.name === name) {
      throw new BadRequestError('NAME_ALREADY_USED');
    }
    if (similarUser.email === email) {
      throw new BadRequestError('EMAIL_ALREADY_USED');
    }
  }

  const passwordHash = await hash(password, 10);

  await models.users.create({ type, name, email, passwordHash });
}

type CreateUserData = Pick<User, 'type' | 'name' | 'email'> & { password: User['passwordHash'] };