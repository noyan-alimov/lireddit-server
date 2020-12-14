import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { COOKIE_NAME, __prod__ } from './constants';
import { MyContext } from './types';
import { createConnection } from 'typeorm';
import { User } from './entities/User';
import { Post } from './entities/Post';
// import path from 'path';

const main = async () => {
	const conn = await createConnection({
		type: 'postgres',
		database: 'lireddit2',
		username: 'postgres',
		password: 'password',
		synchronize: true,
		entities: [Post, User],
		// migrations: [path.join(__dirname, './migrations/*')],
		logging: true,
	});

	// await conn.runMigrations()

	const app = express();

	const RedisStore = connectRedis(session);
	const redis = new Redis();

	app.use(
		session({
			name: COOKIE_NAME,
			store: new RedisStore({ client: redis, disableTouch: true }),
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
				httpOnly: true,
				sameSite: 'lax',
				secure: __prod__,
			},
			saveUninitialized: false,
			secret: 'lsdkhgldkfgjksd',
			resave: false,
		})
	);

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		context: ({ req, res }): MyContext => ({ req, res, redis }),
	});

	apolloServer.applyMiddleware({
		app,
		cors: { origin: 'http://localhost:3000', credentials: true },
	});

	app.listen(4000, () => {
		console.log('Server running on port 4000');
	});
};

main();
