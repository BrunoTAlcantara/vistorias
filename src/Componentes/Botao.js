import React, { Component } from 'react';
import {
    View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
export default class Botao extends Component{

    constructor(props){
      super(props);
      this.state = {};
  
      this.styles = StyleSheet.create({
        botao:{
          width: 330,
          height: 50,
          borderWidth: 2,
          borderColor: props.cor,
          borderRadius: 25,  
          marginTop: 15, 
          marginBottom: 15,               
        },
        btnArea:{
          flex:1,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'          
        },
        btnTexto:{
          fontSize: 18,
          fontWeight: 'bold',
          color: props.cor
        }
  
      });
    }

    render(){
        return(
          <TouchableOpacity style={this.styles.botao} onPress={this.props.onPress} >
            <View style={this.styles.btnArea}>
              <Text style={this.styles.btnTexto} >{this.props.nome}</Text>
            </View>
          </TouchableOpacity>
        );
      }
}