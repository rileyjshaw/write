import {Editor} from 'draft-js';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import './App.css';


class App extends Component {
	componentDidUpdate (prevProps) {
		if (this.Editor && prevProps.editors !== this.props.editors) {
			this.Editor.focus();
		}
	}

	render () {
		const {editors, onChange} = this.props;

		return <div className='App'>
			<div className='App-editor'>
				{editors.map(({x, y, editorState}, i) => <Editor
					editorState={editorState}
					key={i}
					onChange={newState => onChange(newState, i)}
					ref={el => this.Editor = el}
				/>)}
			</div>
		</div>;
	}
}

App.propTypes = {
	editors: PropTypes.arrayOf(PropTypes.object).isRequired,
	onChange: PropTypes.func.isRequired,
}

export default App;
