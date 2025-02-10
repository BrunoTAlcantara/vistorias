import React, { Component } from 'react';
import {  
  StyleSheet,
  Text,
  View,  
  Alert,
  AsyncStorage,
  TextInput,
} from 'react-native';
import Botao from '../Componentes/Botao';
import api from '../Servicos/api';
import Loading from 'react-native-whc-loading';

export default class Login extends Component{
    
  static navigationOptions = ({navigation}) => ({
    title: 'Login',   
    headerTitleStyle: {color: '#1b3056'}
  });

  state = {
    usuarioLogado: null,
    mensagemErro: null,
    email:'',
    senha:''
  };

  async componentDidMount(){
    const token = await AsyncStorage.getItem('@Vistoria:token');
    const usuario = JSON.parse(await AsyncStorage.getItem('@Vistoria:usuario'));
  
    if(token && usuario)
      this.setState({ usuarioLogado: usuario});
    
  }


    render(){

      if(this.state.usuarioLogado){
        return(          
          <View style={styles.container}>                   
          <Loading ref="loading"/>
          <Botao cor="#0aa8af" nome="Sair" onPress={this.sair.bind(this)} />          
        </View>
        );
      }else{
        return(
          <View style={styles.container}>  
          <Loading ref="loading"/>
            <Text style={{fontSize: 30, textAlign: 'center', color: '#0aa8af'}}>Entrar</Text>
            <TextInput style={styles.input} placeholder="Usuário" underlineColorAndroid="transparent" onChangeText={(email)=>{this.setState({email})}}/>

            <TextInput secureTextEntry={true} style={styles.input} placeholder="Senha" underlineColorAndroid="transparent" onChangeText={(senha)=>{this.setState({senha})}}/>

            <Botao cor="#0aa8af" nome="Entrar" onPress={this.entrar.bind(this)} />          
        </View>
       );     
    
      }     
    }

//Acessa API para autenticar usuário 
  entrar = async () =>{  

    this.refs.loading.show();     

    try{    
      const response = await api.post('/ServicosAplicativo/AutenticarUsuario',{
          dsc_login: this.state.email,
          dsc_senha: this.state.senha,
      });    
      
      this.setState({retornoServico: response.data.data});
      
      const { token , usuario } = response.data.data;

      console.log("response= " + JSON.stringify(response.data.data))
      //if(response.data.usuario != null){
      if(response.data.sucesso){
        
        await AsyncStorage.multiSet([
          ['@Vistoria:token', token],
          ['@Vistoria:usuario', JSON.stringify(usuario)],
        ]);          
   
        this.setState({ usuarioLogado: usuario})

        this.irHome();
      }else if(response.data.erroTratado){
        Alert.alert("Erro tratado",response.data.msgErro)
      }else{
        Alert.alert("Erro inseperado", response.data.msgErro)
      }                
  
    } catch (err){    
      Alert.alert("Falha ao acessar serviço = " + err.problem)        
    } finally{
      this.refs.loading.close();
    }
  
  };

//usuário sair
  sair = async () =>{    

    try{

      await AsyncStorage.removeItem('@Vistoria:token')
      await AsyncStorage.removeItem('@Vistoria:usuario')

      console.log("Excluiu")
  
      this.setState({ usuarioLogado: ''})      
      this.irHome();     

    }catch(exception){    
      console.log("Erro= " + exception)

    }finally{
      
    }


  };

  //Navegar para Home
  irHome= async () =>{
    let token = ''
    let usuario = ''

    try{
      token = await AsyncStorage.getItem('@Vistoria:token');
      usuario = JSON.parse(await AsyncStorage.getItem('@Vistoria:usuario'));
    }catch(exception){    
      console.log("Erro= " + exception)

    }

    this.props.navigation.navigate('Home', {token: token, usuario: usuario});
  }

}



  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white',
    },
    input:{
      width: 350,
      height: 50,
      backgroundColor: '#CCC',
      fontSize: 22,
      padding: 5,
      margin: 5
    }
  });