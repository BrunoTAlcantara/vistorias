import React, { Component } from 'react';
import {  
  StyleSheet,
  Text,
  View,  
  Alert,
  AsyncStorage,
  TextInput,
  Picker,
  ScrollView,    
} from 'react-native';
import Botao from '../Componentes/Botao';

var SQLite = require('react-native-sqlite-storage')
var db = SQLite.openDatabase({name: 'vistoria.db', createFromLocation: '~vistoria.db'})

const defaultPlaceholder = '';
const defaultPlaceholderLabel = '';
const defaultPlaceholderCod = '';

export default class VistoriaCadastrar extends Component{
    
  static navigationOptions = ({navigation}) => ({
    title: 'Nova Vistoria',   
    headerTitleStyle: {color: '#1b3056'}   
  });

  constructor(props){
    super(props);
    this.state = { 
      seletorLocalidadeID: defaultPlaceholder,
      usuarioLogado: null,
      mensagemErro: null,
      localidades: [],
      localidade:'',
      observacao:'',
      vistorias: [],
      vistoria: {
        cod_usuario: '',
        cod_localidade: '',
        dsc_localidade: '',
        txt_observacao: ''
    },           
    }; 
  this.irVistoriaListagem = this.irVistoriaListagem.bind(this); 
  }


  async componentDidMount(){
    const token = await AsyncStorage.getItem('@Vistoria:token');
    const usuario = JSON.parse(await AsyncStorage.getItem('@Vistoria:usuario'));

    let vistoria = Object.assign({}, this.state.vistoria);    

    if(token && usuario){
      vistoria.cod_usuario = usuario.cod_usuario; 
      this.setState({ vistoria});
    }      

    const localidades = JSON.parse(await AsyncStorage.getItem('@Vistoria:localidades'));   
    
    
    if(localidades){
      this.setState({ localidades: localidades});    
         
      localidades.forEach(localidade => {
        console.log("############################# localidade.flg_localidade_principal ######################= " + localidade.flg_localidade_principal)
        if(localidade.flg_localidade_principal == 'S')
        this.setState({ seletorLocalidadeID: localidade.cod_localidade})          
      });
    }   

 
    
  }

  irVistoriaListagem(){
    this.props.navigation.navigate('Vistoria');
  }
  
  /*
  async componentWillMount(){    
    const localidades = JSON.parse(await AsyncStorage.getItem('@Vistoria:localidades'));   
    if(localidades){
      this.setState({ localidades: localidades});         
    }
  }
  */


    render(){
        return(
          <ScrollView style={styles.scrow}>
            <View>
              <Text style={{fontSize: 30, textAlign: 'center', color: '#0aa8af'}}>Cadastro de vistorias</Text>  
              <Text style={{fontSize: 16.5, textAlign: 'left', marginLeft: 30, color: '#0aa8af'}}> Localidade </Text>                    
              {this.criarSeletorLocalidades()}
            </View>

            <View style={styles.container}>                          

              <TextInput style={styles.input} placeholder="Observação" underlineColorAndroid="transparent" onChangeText={(observacao)=>{this.setState({observacao})}}/>

              <Botao cor="#0aa8af" nome="Salvar" onPress={this.salvar.bind(this)} />          
            </View>          

          </ScrollView>             
       );             
    }

    //Cria seletor de localidades dinamicamente
  criarSeletorLocalidades(){
    return  <View >
              <Picker
                    mode='dropdown'
                    style={{width: '80%', marginLeft: 30, color: '#0aa8af'}}
                    selectedValue={this.state.seletorLocalidadeID}
                    onValueChange={(itemValue, _itemIndex) => {
                      this.setState({seletorLocalidadeID: itemValue})                                            
                    }}
                >
                <Picker.Item label={defaultPlaceholder} value={defaultPlaceholder}/>
                  {this.renderizarLocalidades()}
                </Picker>
            </View>   
    ;                                   
  }  

  renderizarLocalidades = () => this.state.localidades.map(a => {
    return <Picker.Item key={a.cod_localidade} label={a.dsc_localidade} value={a.cod_localidade}/>;
  });

//Cria nova Vistoria
  salvar = async () =>{  
    
    let vistoria = this.state.vistoria    

    if(vistoria.cod_usuario == undefined || vistoria.cod_usuario == '' || vistoria.cod_usuario == null)
      return Alert.alert("É necessário efetuar login")
    
    if(this.state.seletorLocalidadeID == defaultPlaceholder)
      return Alert.alert("Escolha a localidade")

    vistoria.cod_localidade = this.state.seletorLocalidadeID    

    this.state.localidades.forEach(localidade => {
      if(localidade.cod_localidade == this.state.seletorLocalidadeID){
        
        if(!this.PesquisarLocalidade(localidade.cod_localidade)){        
          this.TratarInclusaoLocalidade(localidade);
        }

        vistoria.dsc_localidade = localidade.dsc_localidade
      }
        
    });

    vistoria.txt_observacao = this.state.observacao
    this.TratarInclusaoVistoria(vistoria);    
  };

  //Navegar para Home
  executarVistoria= async () =>{   

    this.props.navigation.navigate('AmbienteSelecionar', {token: token, usuario: usuario});
  }

  TratarInclusaoVistoria (vistoria) {
    //inclui vistoria           
    let dth_atual = new Date();
    let comando = 'INSERT INTO VISTORIA (cod_vistoriador, cod_localidade, dth_registro, txt_observacao, dth_execucao_vistoria) VALUES (?, ?, ?, ?, ?); '
    let parametros = [vistoria.cod_usuario, vistoria.cod_localidade, dth_atual, vistoria.txt_observacao, dth_atual];     
    this.efetuaInclusao(comando, parametros);  
    this.irVistoriaListagem();
  }
  
  TratarInclusaoLocalidade (localidade) {
    //inclui localidade      
    let flg_ativo = localidade.flg_ativo == undefined ? "N" : "S"
    let comando = 'INSERT INTO LOCALIDADE (cod_localidade, dsc_localidade, sigla_localidade, flg_ativo, dsc_endereco) VALUES (?, ?, ?, ?, ?); '
    let parametros = [localidade.cod_localidade, localidade.dsc_localidade, localidade.sigla_localidade, flg_ativo, localidade.dsc_endereco];     
    this.efetuaInclusao(comando, parametros);  
  }  

  efetuaInclusao (comando, parametros) {
    db.transaction((tx) => {     
   
      tx.executeSql(comando, parametros, (tx, resulQuery) => {      
        console.log("Registro inserido com sucesso! =" + comando);
      });

    });
    
  }

  PesquisarLocalidade(cod_localidade){
    let comando = 'SELECT * FROM localidade where cod_localidade = ?;'  
    let parametros = [cod_localidade];   
    return this.efetuaPesquisa(comando, parametros);
  }

  efetuaPesquisa (comando, parametros) {  
    retorno = false;    
    db.transaction((tx) => {                
      tx.executeSql(comando, parametros, (tx, resulQuery) => {        
        var len = resulQuery.rows.length;        
        if(len > 0) {                
          //existe
          //adiciona itens retornados à lista de vistorias
          retorno = true          
        }          
      });
    });
    return retorno;    
  }

}

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white',
    },
    scrow: {
      backgroundColor: 'white',
    },
    list: { 
      margin: 5, 
      backgroundColor: 'white', 
      height: 80, 
      justifyContent: 'space-around', 
      paddingLeft: 10, 
      elevation: 1 
      },
    input:{
      width: 350,
      height: 50,
      backgroundColor: '#CCC',
      fontSize: 22,
      padding: 5,
      margin: 5,
      color: '#0aa8af'
    }
  });