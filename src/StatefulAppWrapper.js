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

		const rawDraftContentStates = window.localStorage.getItem(hash);
		const editorStates = rawDraftContentStates
			? JSON.parse(rawDraftContentStates).map(rawState => moveFocusToEnd(
				EditorState.createWithContent(convertFromRaw(rawState))))
			: [ContentState.createFromText('hey you.')];

		this.setState({hash, editors: editorStates});
	}

	// TODO(riley): Pad the entire thing (left / right) with spaces so that you
	//              can click **anywhere**!
	//
	//              Padding will need to be uneven for lines with an even # of
	//              chars, but that's actually good! It'll make monospace stuff
	//              line up way better.
	onChange (editorState, i) {
		const {hash, editors} = this.state;
		const contentState = editorState.getCurrentContent();
		console.log(editorState, contentState);
		const updatedEditors = [
			...editors.slice(0, i),
			contentState,
			...editors.slice(i + 1),
		];
		const rawDraftContentStates = JSON.stringify(updatedEditors.map(convertToRaw));
		window.localStorage.setItem(hash, rawDraftContentStates);

		this.setState({editors: [editorState]});
	}

	render () {
		const {editors, hash} = this.state;

		return hash && <App editors={editors} onChange={this.onChange} />
	}
}

export default StatefulAppWrapper;
