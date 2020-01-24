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
		const {className = '', cX, cY, editors, lastFocus, onChange} = this.props;

		return <div className={`App ${className}`}>
			{editors.map(({x, y, editorProps, editorState}, i) => <div
					className={`App-editor${lastFocus === i ? ' focused' : ''}`}
					key={i}
					onClick={e => this.handleContainerClick(e, i)}
					style={{left: cX + x, top: cY + y}}
			>
				<Editor
					{...editorProps}
					editorState={editorState}
					onChange={newState => onChange(newState, i)}
					ref={el => this.Editors[i] = el}
				/>
			</div>)}
		</div>;
	}
}

App.propTypes = {
	className: PropTypes.string,
	editors: PropTypes.arrayOf(PropTypes.object).isRequired,
	onChange: PropTypes.func.isRequired,
	lastFocus: PropTypes.number.isRequired,
}

export default App;
