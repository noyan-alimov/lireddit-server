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

@InputType()
class PostInput {
	@Field()
	title: string;

	@Field()
	text: string;
}

const paginatePosts = (page: number, selection: Post[]) => {
	const start = (page - 1) * 10;
	const end = start + 10;

	const posts = [...selection].reverse();
	return posts.slice(start, end);
};

@Resolver()
export class PostResolver {
	@Query(() => [Post])
	async posts(@Arg('page', () => Int) page: number): Promise<Post[]> {
		const posts = await Post.find({});
		const paginatedPosts = paginatePosts(page, posts);

		return paginatedPosts;
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
