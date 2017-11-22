import {Editor} from 'draft-js';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import './App.css';


class App extends Component {
	Editors = []

	handleContainerClick = (e, i) => {
		this.Editors[i].focus();
	}

	render () {
		const {cX, cY, editors, onChange} = this.props;

		return <div className='App'>
			{editors.map(({x, y, editorState}, i) => <div className='App-editor'
					key={i}
					onClick={e => this.handleContainerClick(e, i)}
					style={{left: cX + x, top: cY + y}}
			>
				<Editor
					editorState={editorState}
					onChange={newState => onChange(newState, i)}
					ref={el => this.Editors[i] = el}
				/>
			</div>)}
		</div>;
	}
}

App.propTypes = {
	editors: PropTypes.arrayOf(PropTypes.object).isRequired,
	onChange: PropTypes.func.isRequired,
}

export default App;
