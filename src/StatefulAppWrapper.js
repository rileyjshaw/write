import {ContentState, convertFromRaw, convertToRaw, EditorState} from 'draft-js';
import React, {Component} from 'react';
import App from './App';
import getSessionId from './getSessionId';

const {moveFocusToEnd} = EditorState;


class StatefulAppWrapper extends Component {
	constructor(props) {
		super(props);
		this.state = {hash: null};

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
			history.pushState(null, null, `#${hash}`);
		}

		const rawDraftContentState = window.localStorage.getItem(hash);
		const contentState = rawDraftContentState
			? convertFromRaw(JSON.parse(rawDraftContentState))
			: ContentState.createFromText('hey you.');
		const editorState = moveFocusToEnd(
			EditorState.createWithContent(contentState));

		this.setState({editorState, hash});
	}

	// TODO(riley): Pad the entire thing (left / right) with spaces so that you
	//              can click **anywhere**!
	//
	//              Padding will need to be uneven for lines with an even # of
	//              chars, but that's actually good! It'll make monospace stuff
	//              line up way better.
	onChange (editorState) {
		const {hash} = this.state;

		const contentState = editorState.getCurrentContent();
		const rawDraftContentState = JSON.stringify(convertToRaw(contentState));
		window.localStorage.setItem(hash, rawDraftContentState);
		this.setState({editorState});
	}

	render () {
		const {editorState, hash} = this.state;

		return hash && <App editorState={editorState} onChange={this.onChange} />
	}
}

export default StatefulAppWrapper;
