import {
	ContentState,
	convertFromRaw,
	convertToRaw,
	EditorState,
} from 'draft-js';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Loader from './Loader';
import Workspace from './Workspace';
import getSessionId from './getSessionId';
import {getHello} from './hello';

import './App.css';

const GRID_PROBE_WIDTH = 10000;
const {moveFocusToEnd} = EditorState;
const MODES = Object.freeze({
	CONTROL: 'control',
	INSERT: 'insert',
	LOAD: 'load',
});
// [key, message, callback]
const NOTICES = Object.freeze({
	DELETE: 'delete',
	CONTROL: 'control',
});
const notices = {
	delete: [
		'Delete? y/N',
		function({key}) {
			switch (key) {
				case 'y':
				case 'Y':
					localStorage.removeItem(
						this.state.documents[this.state.loadIndex]
					);
					this.setState(({documents, loadIndex}) => {
						const newDocuments = [
							...documents.slice(0, loadIndex),
							...documents.slice(loadIndex + 1),
						];
						const newLoadIndex = Math.max(
							0,
							Math.min(loadIndex, documents.length - 2)
						);
						return {
							documents: newDocuments,
							editors: this.getEditors(
								newDocuments[newLoadIndex]
							),
							notice: null,
							loadIndex: newLoadIndex,
						};
					});
					break;
				case 'n':
				case 'N':
				case 'Enter':
					this.setState({notice: null});
					break;
				default:
					break;
			}
		},
	],
	control: ['Control mode'],
};

class App extends Component {
	state = {
		cX: 0,
		cY: 0,
		documents: [],
		editors: [],
		gridGap: null,
		hash: null,
		keyStates: {},
		lastFocus: 0,
		loadIndex: 0,
		mode: MODES.INSERT,
		notice: null,
		showGrid: false,
	};

	componentDidMount() {
		window.addEventListener('click', this.handleClick);
		window.addEventListener('hashchange', this.handleHashChange);
		window.addEventListener('resize', this.measure);
		window.addEventListener('keydown', this.handleKeydown);
		window.addEventListener('keyup', this.handleKeyup);
		this.handleHashChange();
	}

	componentWillUnmount() {
		window.removeEventListener('click', this.handleClick);
		window.removeEventListener('hashchange', this.handleHashChange);
		window.removeEventListener('resize', this.measure);
		window.removeEventListener('keydown', this.handleKeydown);
		window.removeEventListener('keyup', this.handleKeyup);
	}

	componentDidUpdate(prevProps, prevState) {
		if (typeof this.state.gridGap !== 'number' && this.GridProbe) {
			const gridGap =
				(ReactDOM.findDOMNode(this.GridProbe).offsetWidth /
					GRID_PROBE_WIDTH) *
				2;
			document.documentElement.style.setProperty(
				'--grid-gap',
				`${gridGap}px`
			);
			this.setState({gridGap});
		} else if (typeof prevState.gridGap !== 'number') {
			this.measure();
		}
	}

	measure = () => {
		const container = ReactDOM.findDOMNode(this.Container);
		const cX = container.clientWidth / 2;
		const cY = container.clientHeight / 2;

		this.setState({cX, cY});
	};

	// TODO(riley): Store editors in Dexie or PouchDB.
	getEditors = hash => {
		const rawDraftEditors = window.localStorage.getItem(hash);
		return rawDraftEditors
			? JSON.parse(rawDraftEditors).map(({x, y, editorRawContent}) => ({
					x,
					y,
					editorProps: { // TODO(riley): Save and restore props.
						textAlignment: 'center',
						spellCheck: false
					},
					editorState: moveFocusToEnd(
						EditorState.createWithContent(
							convertFromRaw(editorRawContent)
						)
					),
			  }))
			: [
					{
						x: 0,
						y: 0,
						editorProps: {textAlignment: 'center', spellCheck: false},
						editorState: moveFocusToEnd(
							EditorState.createWithContent(
								ContentState.createFromText(`${getHello()}.`)
							)
						),
					},
			  ];
	};

	load = hash => {
		document.title =
			'Write | ' +
			hash
				.split('-')
				.map(word => word[0].toUpperCase() + word.slice(1))
				.join(' ');

		this.setState({
			hash,
			editors: this.getEditors(hash),
			mode: MODES.INSERT,
		});
	};

	handleHashChange = () => {
		let {hash} = window.location;
		if (hash) {
			this.load(hash.slice(1));
		} else this.createNewDocument();
	};

	createNewDocument = () => {
		const hash = getSessionId();
		window.history.pushState(null, null, `#${hash}`);
		this.load(hash);
	};

	handleClick = ({metaKey, pageX, pageY}) => {
		if (metaKey) {
			this.setState(({cX, cY, editors, gridGap, lastFocus}) => ({
				editors: [
					...editors,
					{
						// TODO(riley): Latch to the grid on render, not on construction.
						x: Math.round((pageX - cX) / gridGap) * gridGap,
						y: Math.round((pageY - cY) / gridGap) * gridGap,
						editorProps: {...editors[lastFocus].editorProps},
						editorState: moveFocusToEnd(EditorState.createEmpty()),
					},
				],
				lastFocus: editors.length,
			}));
		} else if (
			!this.state.editors.some(({editorState}) =>
				editorState.getSelection().getHasFocus()
			)
		) {
			const {Container: {Editors = []} = {}} = this;
			if (Editors.length) Editors[0].focus();
		}
	};

	handleChange = (newEditorState, i) => {
		const {hash, editors, lastFocus} = this.state;

		// Update the focused Editor and remove any empty, unfocused ones.
		const updatedEditors = [
			...editors.slice(0, i),
			{...editors[i], editorState: newEditorState},
			...editors.slice(i + 1),
		].filter(
			({editorState}) =>
				editorState.getSelection().getHasFocus() ||
				editorState.getCurrentContent().hasText() ||
				lastFocus === i
		);

		// Persist the current state to localStorage and state.
		const rawDraftEditors = JSON.stringify(
			updatedEditors.map(({x, y, editorState}, j) => ({
				x,
				y,
				editorRawContent: convertToRaw(
					(i === j
						? newEditorState
						: editorState
					).getCurrentContent()
				),
			}))
		);
		window.localStorage.setItem(hash, rawDraftEditors);
		this.setState({editors: updatedEditors, lastFocus: i});
	};

	handleKeyup = e => {
		const {key} = e;
		this.setState({
			keyStates: {
				...this.state.keyStates,
				[key]: false,
			},
		});
	};

	handleKeydown = e => {
		const {key, metaKey, repeat} = e;
		if (repeat) return;
		const {documents, keyStates, loadIndex, mode, notice} = this.state;

		this.setState({
			keyStates: {
				...keyStates,
				[key]: true,
			},
		});

		if (notice && notices[notice][1]) {
			notices[notice][1].call(this, e);
			if (!metaKey) {
				e.preventDefault();
				e.stopPropagation();
			}
		} else if (mode === MODES.LOAD) {
			switch (key) {
				case 'ArrowUp':
					this.setState(({documents, loadIndex}) => {
						const newIndex =
							(documents.length + loadIndex - 1) %
							documents.length;
						return {
							loadIndex: newIndex,
							editors: this.getEditors(documents[newIndex]),
						};
					});
					break;
				case 'ArrowDown':
					this.setState(({documents, loadIndex}) => {
						const newIndex = (loadIndex + 1) % documents.length;
						return {
							loadIndex: newIndex,
							editors: this.getEditors(documents[newIndex]),
						};
					});
					break;
				case 'Enter':
					const newDocument = documents[loadIndex];
					window.history.pushState(null, null, `#${newDocument}`);
					this.load(newDocument);
					this.setState({mode: MODES.INSERT});
					break;
				case 'ArrowRight':
					// Stub: Navigate document history.
					break;
				case 'c':
				case 'C':
					// Stub: Duplicate.
					break;
				case 'd':
				case 'D':
					this.setState({notice: NOTICES.DELETE});
					break;
				case 'r':
				case 'R':
					// Stub: Rename.
					break;
				case 'q':
				case 'Q':
					this.setState({mode: MODES.INSERT});
					break;
				default:
					break;
			}
			if (!metaKey) {
				console.log(`Prevented a ${key}`);
				e.preventDefault();
				e.stopPropagation();
			}
		} else if (mode === MODES.CONTROL && !metaKey) {
			switch (key) {
				case 'ArrowLeft':
					this.setState(({editors, lastFocus}) => {
						const editor = editors[lastFocus];
						const updatedEditors = [
							...editors.slice(0, lastFocus),
							{
								...editor,
								editorProps: {
									...editor.editorProps,
									textAlignment:
										editor.editorProps.textAlignment ===
										'right'
											? 'center'
											: 'left',
								},
							},
							...editors.slice(lastFocus + 1),
						];
						return {
							editors: updatedEditors,
							mode: MODES.INSERT,
						};
					});
					break;
				case 'ArrowRight':
					this.setState(({editors, lastFocus}) => {
						const editor = editors[lastFocus];
						const updatedEditors = [
							...editors.slice(0, lastFocus),
							{
								...editor,
								editorProps: {
									...editor.editorProps,
									textAlignment:
										editor.editorProps.textAlignment ===
										'left'
											? 'center'
											: 'right',
								},
							},
							...editors.slice(lastFocus + 1),
						];
						return {
							editors: updatedEditors,
							mode: MODES.INSERT,
						};
					});
					break;
				case 'g':
				case 'G':
					this.setState(({showGrid}) => ({
						mode: MODES.INSERT,
						showGrid: !showGrid,
					}));
					break;
				case 'n':
				case 'N':
					this.createNewDocument();
					break;
				case 'o':
				case 'O':
					this.setState(() => {
						const documents = Object.keys(localStorage);
						const hash =
							window.location.hash &&
							window.location.hash.slice(1);
						return {
							documents,
							loadIndex: Math.max(0, documents.indexOf(hash)),
							mode: MODES.LOAD,
						};
					});
					break;
				case 's':
				case 'S':
					this.setState(({editors, lastFocus}) => {
						const editor = editors[lastFocus];
						const updatedEditors = [
							...editors.slice(0, lastFocus),
							{
								...editor,
								editorProps: {
									...editor.editorProps,
									spellCheck: !editor.editorProps.spellCheck,
								},
							},
							...editors.slice(lastFocus + 1),
						];
						return {
							editors: updatedEditors,
							mode: MODES.INSERT,
						};
					});
					break;
				default:
					this.setState({mode: MODES.INSERT});
					return;
			}
			e.preventDefault();
			e.stopPropagation();
		} else if (metaKey && key.toLowerCase() === 'e') {
			// If it's in insert or control mode, toggle to the other one. Otherwise, don't change the mode.
			this.setState(({mode}) => ({
				mode:
					{insert: MODES.CONTROL, control: MODES.INSERT}[mode] ||
					mode,
			}));
		}
	};

	render() {
		const {
			cX,
			cY,
			documents,
			editors,
			gridGap,
			hash,
			keyStates,
			lastFocus,
			loadIndex,
			mode,
			notice,
			showGrid,
		} = this.state;

		const sized = typeof gridGap === 'number';
		return (
			<div
				className={`App${
					sized && (showGrid || mode === 'control' || keyStates.Meta)
						? ' show-grid'
						: ''
				} control-mode-${mode === 'control' ? 'on' : 'off'}`}
				style={
					sized
						? {
								backgroundSize: `${gridGap}px ${gridGap}px`,
								lineHeight: `${gridGap}px`,
						  }
						: {}
				}
			>
				{hash &&
					(sized ? (
						<>
							{mode === MODES.LOAD && (
								<Loader
									documents={documents}
									index={loadIndex}
								/>
							)}
							{notice && (
								<p>
									<strong className="App-notice">
										{notices[notice][0]}
									</strong>
								</p>
							)}
							<Workspace
								cX={cX}
								cY={cY}
								editors={editors}
								lastFocus={lastFocus}
								onChange={this.handleChange}
								ref={el => (this.Container = el)}
							/>
						</>
					) : (
						<span
							className="Grid-probe"
							ref={el => (this.GridProbe = el)}
						>
							{new Array(GRID_PROBE_WIDTH).fill('0').join('')}
						</span>
					))}
			</div>
		);
	}
}

export default App;
