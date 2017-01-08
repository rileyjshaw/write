import {Editor} from 'draft-js';
import React, {Component} from 'react';
import './App.css';


class App extends Component {
	componentDidUpdate (prevProps) {
		if (this.Editor && prevProps.editorState !== this.props.editorState) {
			this.Editor.focus();
		}
	}

	render () {
		const {editorState, onChange} = this.props;

		return <div className="App">
			<div className='App-editor'>
				<Editor
					editorState={editorState}
					onChange={onChange}
					ref={el => this.Editor = el}
				/>
			</div>
		</div>;
	}
}

App.propTypes = {
	editorState: React.PropTypes.object.isRequired,
	onChange: React.PropTypes.func.isRequired,
}

export default App;
