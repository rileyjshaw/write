import {ContentState, convertFromRaw, convertToRaw, EditorState} from 'draft-js';
import React, {Component} from 'react';
import App from './App';
import getSessionId from './getSessionId';

const {moveFocusToEnd} = EditorState;


class StatefulAppWrapper extends Component {
	constructor(props) {
		super(props);
		this.state = {hash: null, editors: []};

		// Bind methods that use state.
		['load', 'onChange', 'render'].forEach(method =>
			this[method] = this[method].bind(this));
	}

	componentDidMount () {
		window.addEventListener('hashchange', this.load);
		this.load();
	}

	componentWillUnmount () {
		window.removeEventListener('hashchange', this.load);
	}

	load () {
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
			? JSON.parse(rawDraftEditors).map(rawState => ({
				...rawState,
				editorState: moveFocusToEnd(EditorState.createWithContent(
					convertFromRaw(rawState.editorRawContent))),
			}))
			: [{
				x: 0,
				y: 0,
				editorState: EditorState.createWithContent(
					ContentState.createFromText('hey you.')),
			}];

		this.setState({hash, editors});
	}

	onChange (editorState, i) {
		const {hash, editors} = this.state;

		const updatedEditors = [
			...editors.slice(0, i),
			{...editors[i], editorState},
			...editors.slice(i + 1),
		];
		const rawDraftEditors = JSON.stringify(updatedEditors.map(editor => ({
			...editor,
			editorRawContent: convertToRaw(editorState.getCurrentContent()),
		})));
		window.localStorage.setItem(hash, rawDraftEditors);
		this.setState({editors: updatedEditors});
	}

	render () {
		const {editors, hash} = this.state;

		return hash && <App editors={editors} onChange={this.onChange} />
	}
}

export default StatefulAppWrapper;
