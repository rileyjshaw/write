import {Editor} from 'draft-js';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import './Workspace.css';

class Workspace extends Component {
	Editors = [];

	handleContainerClick = (e, i) => {
		this.Editors[i].focus();
	};

	render() {
		const {
			className = '',
			cX,
			cY,
			editors,
			lastFocus,
			onChange,
		} = this.props;

		return (
			<div className={`Workspace ${className}`}>
				{editors.map(({x, y, editorProps, editorState}, i) => (
					/* eslint-disable */
					/* TODO(riley): Fix a11y issues. */
					<div
						className={`Workspace-editor${
							lastFocus === i ? ' focused' : ''
						}`}
						key={i}
						onClick={e => this.handleContainerClick(e, i)}
						style={{left: cX + x, top: cY + y}}
					>
						{/* eslint enable */}
						<Editor
							{...editorProps}
							stripPastedStyles={true}
							editorState={editorState}
							onChange={newState => onChange(newState, i)}
							ref={el => (this.Editors[i] = el)}
						/>
					</div>
				))}
			</div>
		);
	}
}

Workspace.propTypes = {
	className: PropTypes.string,
	editors: PropTypes.arrayOf(PropTypes.object).isRequired,
	onChange: PropTypes.func.isRequired,
	lastFocus: PropTypes.number.isRequired,
};

export default Workspace;
