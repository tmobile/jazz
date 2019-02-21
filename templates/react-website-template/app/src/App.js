import React, { Component } from 'react';
import Header from './components/Header';
import Contents from './components/Contents';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './components/contents.css'

class App extends Component {
  render() {
    return (
      <div className="header">
        <Header />
        <Contents />
      </div>
    );
  }
}

export default App;
