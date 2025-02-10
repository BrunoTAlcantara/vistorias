import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button
} from 'react-native';
import { TabNavigator } from 'react-navigation';
import TelaPrincipal from './src/Telas/TelaPrincipal';
import Vistoria from './src/Telas/Vistoria';
import Login from './src/Telas/Login';
console.disableYellowBox=true;



const Navegador = TabNavigator({
  Home: { screen: TelaPrincipal },
  //Login: { screen: Login },
  Vistoria: { screen: Vistoria}  
},{
  tabBarPosition: 'bottom',
  tabBarOptions:{
    activeTintColor: '#ffffff',
    inactiveTintColor: '#CCCCCC',
    showIcon: true,
    style:{
      backgroundColor: '#1b3056'
    },
    indicatorStyle:{
      backgroundColor: null 
    }
  }




});

export default Navegador;
/*
export default class App extends Component{
  render(){
    <Provider store={store}>
      <Navegador/>
    </Provider>
  }
}

*/
