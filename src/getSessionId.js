// Returns a calm, memorable session ID that's not already in `localStorage`.

const randomFrom = arr => arr[Math.floor(Math.random() * arr.length)];

const adjectives = [
	'mossy',
	'moonlit',
	'foggy',
	'distant',
	'silent',
	'soothing',
];

const nouns = [
	'brook',
	'meadow',
	'forest',
	'plane',
	'desert',
	'oasis',
];

export default function getSession () {
	let adjective = '', noun = '', sessionId = '';

	do {
		adjective = randomFrom(adjectives);
		noun = randomFrom(nouns);
		sessionId = `${adjective}-${noun}`
	} while (window.localStorage.getItem(sessionId));

	return sessionId;
}
