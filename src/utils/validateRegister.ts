import { UsernamePasswordInput } from 'src/types/UsernamePasswordInput';
import { User } from '../entities/User';

export const validateRegister = async (
	options: UsernamePasswordInput,
	em: any
) => {
	if (!options.email.includes('@')) {
		return [
			{
				field: 'email',
				message: 'invalid email',
			},
		];
	}

	if (options.username.length <= 2) {
		return [
			{
				field: 'username',
				message: 'length must be greater than 2',
			},
		];
	}

	if (options.password.length <= 6) {
		return [
			{
				field: 'password',
				message: 'length must be greater than 6',
			},
		];
	}

	const isUserTaken = await em.findOne(User, { username: options.username });
	if (isUserTaken) {
		return [
			{
				field: 'username',
				message: 'username already taken',
			},
		];
	}

	if (options.username.includes('@')) {
		return [
			{
				field: 'username',
				message: "can't include an @ sign",
			},
		];
	}

	return null;
};
