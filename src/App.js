import React from 'react';

import { Article, Brand, CTA, Features, Navbar } from './components';
import {Featured, Footer, Header, MostViewed, Recommanded, SelectCatagories, ShoppingImage } from './containers';

const App = () => {
  return (
    <div className='App'>
      <div className='gradient_bg'>
        <Navbar />
        <Header />
    </div>
      <Brand />
      <Article />
      <CTA /> 
      <Features />
      <Featured />
      <Footer />
      <Recommanded />
      <ShoppingImage />
    </div>
  )
}

export default App