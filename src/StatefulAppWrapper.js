import {ContentState, convertFromRaw, convertToRaw, EditorState} from 'draft-js';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import getSessionId from './getSessionId';
import {getHello} from './hello';

const {moveFocusToEnd} = EditorState;


const FONT_SIZE_PX = 13;
const LINE_HEIGHT_PX = 18;

class StatefulAppWrapper extends Component {
	state = {cX: 0, cY: 0, gridX: null, hash: null, editors: [], lastFocus: 0, controlMode: false};

	componentDidMount () {
		window.addEventListener('click', this.handleClick);
		window.addEventListener('hashchange', this.load);
		window.addEventListener('resize', this.measure);
		window.addEventListener('keydown', this.handleKeydown);
		window.addEventListener('keyup', this.handleKeyup);
		this.load();
	}

	componentWillUnmount () {
		window.removeEventListener('click', this.handleClick);
		window.removeEventListener('hashchange', this.load);
		window.removeEventListener('resize', this.measure);
		window.removeEventListener('keydown', this.handleKeydown);
		window.removeEventListener('keyup', this.handleKeyup);
	}

	componentDidUpdate (prevProps, prevState) {
		const {gridX} = this.state;

		if (typeof gridX !== 'number' && this.GridProbe) {
			this.setState({gridX: ReactDOM.findDOMNode(this.GridProbe).offsetWidth / 1000});
		} else if (typeof prevState.gridX !== 'number') {
			this.measure();
		}
	}

	measure = () => {
		const container = ReactDOM.findDOMNode(this.Container);
		const cX = container.clientWidth / 2;
		const cY = container.clientHeight / 2;

		this.setState({cX, cY});
	}

	load = () => {
		let {hash} = window.location;
		if (hash) {
			hash = hash.slice(1);
		} else {
			hash = getSessionId();
			window.history.pushState(null, null, `#${hash}`);
		}

		document.title = 'Write | ' + hash
			.split('-')
			.map(word => word[0].toUpperCase() + word.slice(1))
			.join(' ');

		const rawDraftEditors = window.localStorage.getItem(hash);
		const editors = rawDraftEditors
			? JSON.parse(rawDraftEditors).map(({x, y, editorRawContent}) => ({
				x,
				y,
				editorProps: {textAlignment: 'center'},  // TODO(riley): Save and restore props.
				editorState: moveFocusToEnd(EditorState.createWithContent(
					convertFromRaw(editorRawContent))),
			}))
			: [{
				x: 0,
				y: 0,
				editorProps: {textAlignment: 'center'},
				editorState: moveFocusToEnd(EditorState.createWithContent(
					ContentState.createFromText(`${getHello()}.`))),
			}];

		this.setState({hash, editors});
	}

	handleClick = ({metaKey, pageX, pageY}) => {
		if (metaKey) {
			this.setState(({cX, cY, editors, lastFocus}) => ({
				editors: [
					...editors,
					{
						// TODO(riley): Some magic here.
						// TODO(riley): Latch to the grid on render, not on construction.
						x: Math.round((pageX - cX) / FONT_SIZE_PX) * FONT_SIZE_PX - 2,
						y: Math.round((pageY - cY) / LINE_HEIGHT_PX) * LINE_HEIGHT_PX,
						editorProps: {...editors[lastFocus].editorProps},
						editorState: moveFocusToEnd(EditorState.createEmpty()),
					},
				],
				lastFocus: editors.length,
			}));
		} else if (!this.state.editors.some(({editorState}) =>
				editorState.getSelection().getHasFocus())) {
			const {Container: {Editors = []} = {}} = this;
			if (Editors.length) Editors[0].focus();
		}
	}

	handleChange = (newEditorState, i) => {
		const {hash, editors, lastFocus} = this.state;

		// Update the focused Editor and remove any empty, unfocused ones.
		const updatedEditors = [
			...editors.slice(0, i),
			{...editors[i], editorState: newEditorState},
			...editors.slice(i + 1),
		].filter(({editorState}) => editorState.getSelection().getHasFocus() ||
			editorState.getCurrentContent().hasText() || lastFocus === i);

		// Persist the current state to localStorage and state.
		const rawDraftEditors = JSON.stringify(
			updatedEditors.map(({x, y, editorState}, j) => ({
				x,
				y,
				editorRawContent: convertToRaw(((i === j)
					? newEditorState
					: editorState
				).getCurrentContent()),
			}))
		);
		window.localStorage.setItem(hash, rawDraftEditors);
		this.setState({editors: updatedEditors, lastFocus: i});
	}

	handleKeydown = (e) => {
		const {key, metaKey} = e;
		const {controlMode} = this.state;
		if (controlMode && !metaKey) {
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
									textAlignment: editor.editorProps.textAlignment === 'right'
										? 'center'
										: 'left',
								},
							},
							...editors.slice(lastFocus + 1),
						];
						return {
							editors: updatedEditors,
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
									textAlignment: editor.editorProps.textAlignment === 'left'
										? 'center'
										: 'right',
								},
							},
							...editors.slice(lastFocus + 1),
						];
						return {
							editors: updatedEditors,
						};
					});
					break;
				default:
					break;
			}
			this.setState({controlMode: false});
			e.preventDefault();
			e.stopPropagation();
		} else if (metaKey && key.toLowerCase() === 'e') {
			this.setState(({controlMode}) => ({controlMode: !controlMode}));
		}
	}

	render () {
		const {controlMode, cX, cY, editors, gridX, hash, lastFocus} = this.state;

		return hash && (typeof gridX === 'number'
			? <App
				className={`control-mode-${controlMode ? 'on' : 'off'}`}
				cX={cX}
				cY={cY}
				editors={editors}
				lastFocus={lastFocus}
				onChange={this.handleChange}
				ref={el => this.Container = el}
			/>
			: <span className='Grid-probe' ref={el => this.GridProbe = el}>
				{new Array(1000).fill('.').join('')}
			</span>);
	}
}

export default StatefulAppWrapper;
