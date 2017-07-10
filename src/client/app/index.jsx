import React from 'react';
import {render} from 'react-dom';
import d3 from 'd3';

import Viz from './components/Viz/Viz.jsx';

class App extends React.Component {
  render () {
    return <Viz />;
  }
}

render(<App/>, document.getElementById('app'));
