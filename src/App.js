import React from 'react';

import { Article, Brand, CTA, Features, Navbar } from './components';
import { Featured, Footer, Header, MostViewed, SelectCatagories, Recommanded,  ShoppingImage } from './containers';

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
      <MostViewed />
      <SelectCatagories />
      <Recommanded />
      <ShoppingImage />
    </div>
  )
}

export default App