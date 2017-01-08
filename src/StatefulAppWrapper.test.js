import React from 'react';
import ReactDOM from 'react-dom';
import StatefulAppWrapper from './StatefulAppWrapper';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<StatefulAppWrapper />, div);
});
