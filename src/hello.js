const hellos = ['Hello', 'Ready', 'Go on'];

export function getHello() {
	return hellos[Math.floor(Math.random() * hellos.length)];
}

export default hellos;
