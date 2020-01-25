import React from 'react';

import './Loader.css';

export default ({documents, index}) => (
	<ul className="Loader">
		{documents.map((title, i) => (
			<li key={title} className={i === index ? 'highlighted' : ''}>
				{title}
			</li>
		))}
	</ul>
);
