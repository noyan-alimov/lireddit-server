import { Post } from '../entities/Post';
import {
	Arg,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	Query,
	Resolver,
	UseMiddleware,
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';

@InputType()
class PostInput {
	@Field()
	title: string;

	@Field()
	text: string;
}

@Resolver()
export class PostResolver {
	@Query(() => [Post])
	posts(
		@Arg('limit', () => Int) limit: number,
		@Arg('cursor', () => String, { nullable: true }) cursor: string | null
	): Promise<Post[]> {
		const realLimit = Math.min(50, limit);
		const queryBuilder = getConnection()
			.getRepository(Post)
			.createQueryBuilder('p')
			.orderBy('"createdAt"', 'DESC')
			.take(realLimit);
		if (cursor) {
			queryBuilder.where('"createdAt" < :cursor', {
				cursor: new Date(parseInt(cursor)),
			});
		}

		return queryBuilder.getMany();
	}

	@Query(() => Post, { nullable: true })
	post(
		@Arg('id', () => Int)
		id: number
	): Promise<Post | undefined> {
		return Post.findOne(id);
	}

	@Mutation(() => Post)
	@UseMiddleware(isAuth)
	createPost(
		@Arg('input', () => PostInput)
		input: PostInput,

		@Ctx() { req }: MyContext
	): Promise<Post> {
		return Post.create({
			...input,
			creatorId: req.session.userId,
		}).save();
	}

	@Mutation(() => Post, { nullable: true })
	async updatePost(
		@Arg('id', () => Int)
		id: number,

		@Arg('title', () => String)
		title: string
	): Promise<Post | null> {
		const post = await Post.findOne(id);
		if (!post) {
			return null;
		}

		if (typeof title !== 'undefined') {
			await Post.update({ id }, { title });
		}
		return post;
	}

	@Mutation(() => Boolean)
	async deletePost(
		@Arg('id', () => Int)
		id: number
	): Promise<Boolean> {
		try {
			await Post.delete(id);
			return true;
		} catch (err) {
			console.error(err);
			return false;
		}
	}
}
