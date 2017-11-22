import {ContentState, convertFromRaw, convertToRaw, EditorState} from 'draft-js';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import getSessionId from './getSessionId';

const {moveFocusToEnd} = EditorState;


const FONT_SIZE_PX = 13;
const LINE_HEIGHT_PX = 18;

class StatefulAppWrapper extends Component {
	state = {cX: 0, cY: 0, hash: null, editors: []};

	componentDidMount () {
		window.addEventListener('click', this.handleClick);
		window.addEventListener('hashchange', this.load);
		window.addEventListener('resize', this.measure);
		this.load();
		window.setTimeout(this.measure);
	}

	componentWillUnmount () {
		window.removeEventListener('click', this.handleClick);
		window.removeEventListener('hashchange', this.load);
		window.removeEventListener('resize', this.measure);
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
				editorState: moveFocusToEnd(EditorState.createWithContent(
					convertFromRaw(editorRawContent))),
			}))
			: [{
				x: 0,
				y: 0,
				editorState: moveFocusToEnd(EditorState.createWithContent(
					ContentState.createFromText('hey you.'))),
			}];

		this.setState({hash, editors});
	}

	handleClick = ({metaKey, pageX, pageY}) => {
		if (metaKey) {
			this.setState(({cX, cY, editors}) => ({
				editors: [
					...editors,
					{
						// TODO(riley): Some magic here.
						x: Math.round((pageX - cX) / FONT_SIZE_PX) * FONT_SIZE_PX - 2,
						y: Math.round((pageY - cY) / LINE_HEIGHT_PX) * LINE_HEIGHT_PX,
						editorState: moveFocusToEnd(EditorState.createEmpty()),
					},
				],
			}));
		}
	}

	handleChange = (newEditorState, i) => {
		const {hash, editors} = this.state;

		const updatedEditors = [
			...editors.slice(0, i),
			{...editors[i], editorState: newEditorState},
			...editors.slice(i + 1),
		].filter(({editorState}) => editorState.inCompositionMode || editorState.getCurrentContent().hasText());
		window.abc = updatedEditors[0].editorState.getCurrentContent();
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
		this.setState({editors: updatedEditors});
	}

	render () {
		const {cX, cY, editors, hash} = this.state;

		return hash && <App
			cX={cX}
			cY={cY}
			editors={editors}
			onChange={this.handleChange}
			ref={el => this.Container = el}
		/>
	}
}

export default StatefulAppWrapper;
