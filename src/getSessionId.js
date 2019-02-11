// Returns a calm, memorable session ID that's not already in `localStorage`.

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
	const nAdjectives = adjectives.length, nNouns = nouns.length;

	const initialAdjectiveIdx = Math.floor(Math.random() * nAdjectives);
	const initialNounIdx = Math.floor(Math.random() * nNouns);

	for (let adjectiveOffset = 0; adjectiveOffset < nAdjectives; ++adjectiveOffset) {
		for (let nounOffset = 0; nounOffset < nNouns; ++nounOffset) {
			const adjectiveIdx = (initialAdjectiveIdx + adjectiveOffset) % nAdjectives;
			const nounIdx = (initialNounIdx + nounOffset) % nNouns;
			const adjective = adjectives[adjectiveIdx];
			const noun = nouns[nounIdx];
			const sessionId = `${adjective}-${noun}`;

			if (!window.localStorage.getItem(sessionId)) return sessionId;
		}
	}

	// We've exhausted all possibilities. Now we start into the numbered IDs.
	const sessionPrefix = `${adjectives[initialAdjectiveIdx]}-${nouns[initialNounIdx]}`;
	let sessionId = 0, n = 1;
	do {
		sessionId = `${sessionPrefix}-${++n}`
	} while (!window.localStorage.getItem(sessionId));

	return sessionId;
}
