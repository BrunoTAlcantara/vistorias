import React, { Component } from 'react';
import {
  Platform,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Image, 
  Alert,
  AsyncStorage
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import Botao from '../Componentes/Botao';
import api from '../Servicos/api';
import Login from '../Telas/Login';
import Moment from 'moment';
import Loading from 'react-native-whc-loading';

var ptBrLocale = require('moment/locale/pt-br'); 
Moment.locale('pt-br', ptBrLocale);

var SQLite = require('react-native-sqlite-storage')
var db = SQLite.openDatabase({name: 'vistoria.db', createFromLocation: '~vistoria.db'})


export class TelaPrincipal extends Component {

  static navigationOptions = ({navigation}) => ({
    //title: 'Home',         
    headerTitle:(      
      <View style={{flex:1, flexDirection:'row', justifyContent:'center'}}>
        <Image 
            source={require('../img/logo_empresa.png')} 
            style={{width: 220, height: 40}} 
        />  
      </View>
    )
  });

  state = {
    configuracao: [],
    mensagemErro: null, 
    retornoServico:[],  
    usuarioLogado: null,
    token: null,
    dataSincronizacao: '',
    ProcLocalidade: false,  
    ProcAmbiente: false,
    ProcAmbientesFilho: false,
    ProcTipoItemAmbiente: false,
    ProcOpcaoRespostra: false,
    ProcTipoResposta: false,
    alertou: false  
  }

  constructor(props){
  super(props);
  this.state = {     
    localidade: "",   
  };    
  this.irLogin = this.irLogin.bind(this); 
  }

  //na inicialização
  async componentDidMount(){
    
    const token = await AsyncStorage.getItem('@Vistoria:token');
    const usuario = JSON.parse(await AsyncStorage.getItem('@Vistoria:usuario'));
   
    if(token && usuario){
      this.setState({ usuarioLogado: usuario}); 
      this.setState({ token: token}); 
    }
      
      
    const dataSincronizacao = await AsyncStorage.getItem('@Vistoria:dataSincronizacao');  
    
    if(dataSincronizacao)      
      this.setState({ dataSincronizacao: dataSincronizacao});

  }

  irLogin(){
    this.props.navigation.navigate('Login');
  }

  //recebe parametros da navegação entre telas
  componentWillReceiveProps(nextProps){
    this.setState({usuarioLogado: nextProps.navigation.state.params.usuario})
    this.setState({token: nextProps.navigation.state.params.token})
  }


  render() {
    
    if(this.state.usuarioLogado){
      return(
      <View style={styles.container} > 
      <Loading ref="loading"/>
      { this.state.dataSincronizacao && <Text style={styles.user}>Data da última sincronização: {Moment(this.state.dataSincronizacao).format('L') }</Text>  }
       
        { this.state.usuarioLogado && <Text style={styles.user}>Olá {this.state.usuarioLogado.nom_usuario}</Text> }
              
        <Botao cor="#0aa8af" nome="Sincronizar configurações" onPress={this.recuperarParametrosVistoria.bind(this)} />
        <Botao cor="#0aa8af" nome="Efetuar Logoff" onPress={this.irLogin.bind(this)} />

      </View>                
      );
    }else{
      return(
        
        <View style={styles.container} >   
        <Loading ref="loading"/>
        { this.state.dataSincronizacao && <Text style={styles.user}>Data da última sincronização: {Moment(this.state.dataSincronizacao).format('L') }</Text>  }         
          
          <Botao cor="#0aa8af" nome="Sincronizar configurações" onPress={this.recuperarParametrosVistoria.bind(this)} />
          <Botao cor="#0aa8af" nome="Efetuar Login" onPress={this.irLogin.bind(this)} />          

        </View>  
         
      );     

    }

  }

//Acessa API para obter parametros de vistoria 
  recuperarParametrosVistoria = async () =>{  
    
    Alert.alert("Isso pode levar até 10 min. Não feche o app.")
    this.refs.loading.show();  

    try{         
      const response = await api.get('/ServicosAplicativo/RecuperarParametrosDeVistoria', {
        token: this.state.token
      }); 
      

      this.setState({retornoServico: response.data.data});      

      if(response.data.sucesso){
        
        await AsyncStorage.multiSet([
          ['@Vistoria:localidades', JSON.stringify(response.data.data.lstLocalidade)],  
          ['@Vistoria:dataSincronizacao', response.data.data.dth_sincronizacao],        
        ]);  

        this.setState({ dataSincronizacao: response.data.data.dth_sincronizacao});
        

      }else if(response.data.erroTratado){
        this.refs.loading.close();
        Alert.alert(response.data.msgErro)        
      }else{
        this.refs.loading.close();
        Alert.alert("Erro inseperado= " + response.data.msgErro)
      }         

    } catch (err){      
      this.refs.loading.close();    
      Alert.alert("Falha ao acessar serviço = " + err.problem) 
    } finally{
      //*
      this.LimpaTabelas();  
      //inclui localidade
      this.state.retornoServico.lstLocalidade.forEach(localidade => {
        var chamadaRetorno = ()=>{};

        chamadaRetorno = ()=>{             
          if(this.state.retornoServico.lstLocalidade[this.state.retornoServico.lstLocalidade.length-1].cod_localidade == localidade.cod_localidade){        
            this.setState({ ProcLocalidade: true});                                           
          }              
          if(this.state.ProcLocalidade && this.state.ProcAmbiente && this.state.ProcAmbientesFilho && this.state.ProcOpcaoRespostra && this.state.ProcTipoItemAmbiente && this.state.ProcTipoResposta){                               
            this.refs.loading.close();                 
          }                       
      }; 

        let flg_ativo = localidade.flg_ativo == undefined ? "N" : "S"
        let comando = 'INSERT INTO localidade (cod_localidade, dsc_localidade, sigla_localidade, flg_ativo, dsc_endereco) VALUES (?, ?, ?, ?, ?);'    
        let parametros = [localidade.cod_localidade, localidade.dsc_localidade, localidade.sigla_localidade, flg_ativo, localidade.dsc_endereco]; 
        this.efetuaInclusao(comando, parametros, chamadaRetorno, "localidade");      

        //inclui cada ambiente da localidade
        localidade.lstAmbiente.forEach(ambiente => {     

          var chamadaRetorno = ()=>{};  
         
          chamadaRetorno = ()=>{      
            if(this.state.ProcLocalidade){       
              if(localidade.lstAmbiente[localidade.lstAmbiente.length-1].cod_ambiente == ambiente.cod_ambiente){        
                this.setState({ ProcAmbiente: true});                                           
              }              
              if(this.state.ProcLocalidade && this.state.ProcAmbiente && this.state.ProcAmbientesFilho && this.state.ProcOpcaoRespostra && this.state.ProcTipoItemAmbiente && this.state.ProcTipoResposta){                               
                this.refs.loading.close();  
              }      
            }                 
          }; 
 
          let comando = 'INSERT INTO ambiente_localidade (cod_ambiente, cod_ambiente_pai, cod_localidade, dsc_ambiente, cod_categoria_ambiente) VALUES (?, ?, ?, ?, ?);'         
          let parametros = [ambiente.cod_ambiente, ambiente.cod_ambiente, localidade.cod_localidade, ambiente.dsc_ambiente, ambiente.clsCategoriaAmbiente.cod_categoria_ambiente];                 
          this.efetuaInclusao(comando, parametros, chamadaRetorno, "ambiente_localidade");
        
          //Se tem lista de filhos, inclui        
          if(ambiente.lstAmbientesFilho!= null && ambiente.lstAmbientesFilho!= undefined)
            this.TrataInclusaoFilho(ambiente.lstAmbientesFilho, ambiente.cod_ambiente, localidade.cod_localidade);        
        
          //Se o ambiente tem lista de tipos de itens, inclui
          if(ambiente.lstTipoItemVistoria!= null && ambiente.lstTipoItemVistoria!= undefined)        
            this.TrataInclusaoTipoItemAmbiente(ambiente.lstTipoItemVistoria);    

        }); //foreach ambiente da localidade
          
      });//foreach da localidade

      //setTimeout(function(){ this.refs.loading.close(); Alert.alert("Dados Sicronizados!")}, 3000);
    }

    

  };
  //-------------------
  LimpaTabelas(){
    //this.efetuaPesquisa('SELECT * FROM localidade WHERE cod_localidade =' + 1); 
    let comando = 'DELETE FROM localidade ;' 
    this.efetuaExclusao(comando)

    comando = 'DELETE FROM ambiente_localidade ;' 
    this.efetuaExclusao(comando)

    comando = 'DELETE FROM tipo_item_vistoria ;' 
    this.efetuaExclusao(comando)

    comando = 'DELETE FROM opcao_resposta_item ;' 
    this.efetuaExclusao(comando)

    comando = 'DELETE FROM tipo_nota ;' 
    this.efetuaExclusao(comando)
  }

  TrataInclusaoFilho (ambientes, cod_pai, cod_localidade) {    

    //inclui cada ambiente filho do ambiente filho
    if(ambientes!= null && ambientes!= undefined){

      ambientes.forEach(ambienteFilho => {      
        
        var chamadaRetorno = ()=>{};  
         
        chamadaRetorno = ()=>{         
          if(this.state.ProcAmbiente){
            if(ambientes[ambientes.length-1].cod_ambiente == ambienteFilho.cod_ambiente){        
              this.setState({ ProcAmbientesFilho: true});                                           
            }              
            if(this.state.ProcLocalidade && this.state.ProcAmbiente && this.state.ProcAmbientesFilho && this.state.ProcOpcaoRespostra && this.state.ProcTipoItemAmbiente && this.state.ProcTipoResposta){                               
              this.refs.loading.close();  
            }   
          }                  
        }; 


        let comando = 'INSERT INTO ambiente_localidade (cod_ambiente, cod_ambiente_pai, cod_localidade, dsc_ambiente, cod_categoria_ambiente) VALUES (?, ?, ?, ?, ?);'     
        let parametros = [ambienteFilho.cod_ambiente, cod_pai, cod_localidade, ambienteFilho.dsc_ambiente, ambienteFilho.clsCategoriaAmbiente.cod_categoria_ambiente]; 
        this.efetuaInclusao(comando, parametros, chamadaRetorno, "ambiente_localidade - filho");
  
        //Se tem lista de filhos inclui
        if(ambienteFilho.lstAmbientesFilho!= null && ambienteFilho.lstAmbientesFilho!= undefined)
          this.TrataInclusaoFilho(ambienteFilho.lstAmbientesFilho, ambienteFilho.cod_ambiente, cod_localidade);      
        
        //Se o ambiente tem lista de tipos de itens, inclui
        if(ambienteFilho.lstTipoItemVistoria!= null && ambienteFilho.lstTipoItemVistoria!= undefined)
          this.TrataInclusaoTipoItemAmbiente(ambienteFilho.lstTipoItemVistoria); 
  
      });

    }
  
  }

  TrataInclusaoTipoItemAmbiente (tiposItemAmbiente) {
    //inclui cada tipo de item por ambiente
    tiposItemAmbiente.forEach(tipoItem => {    

      var chamadaRetorno = ()=>{};  
         
      chamadaRetorno = ()=>{     
        if(this.state.ProcAmbientesFilho){        
          if(tiposItemAmbiente[tiposItemAmbiente.length-1].cod_tipo_item_vistoria == tipoItem.cod_tipo_item_vistoria){        
            this.setState({ ProcTipoItemAmbiente: true});                                           
          }              
          if(this.state.ProcLocalidade && this.state.ProcAmbiente && this.state.ProcAmbientesFilho && this.state.ProcOpcaoRespostra && this.state.ProcTipoItemAmbiente && this.state.ProcTipoResposta){                               
            this.refs.loading.close();                               
          }   
        }                     
      };

      let flg_ativo = tipoItem.flg_ativo == undefined ? "N" : "S"    
      let comando = 'INSERT INTO tipo_item_vistoria (cod_tipo_item_vistoria, dsc_item, flg_ativo) VALUES (?, ?, ?); ' 
      let parametros = [tipoItem.cod_tipo_item_vistoria, tipoItem.dsc_item, flg_ativo];      
      this.efetuaInclusao(comando, parametros, chamadaRetorno, "tipo_item_vistoria");    

      //Se o ambiente tem lista de tipos de itens, inclui
      if(tipoItem.lstOpcaoRespostaItem!= null && tipoItem.lstOpcaoRespostaItem!= undefined)
        this.TrataInclusaoOpcaoRespostaItem(tipoItem.lstOpcaoRespostaItem); 

    });
  }

  TrataInclusaoOpcaoRespostaItem (opcoesRespostaItem) {
    //inclui opcao de resposta por item
    opcoesRespostaItem.forEach(opcaoResposta => {    
      
      var chamadaRetorno = ()=>{};  
         
      chamadaRetorno = ()=>{             
        if(this.state.ProcTipoItemAmbiente){  
          if(opcoesRespostaItem[opcoesRespostaItem.length-1].cod_opcao_resposta == opcaoResposta.cod_opcao_resposta){        
            this.setState({ ProcOpcaoRespostra: true});                                           
          }              
          if(this.state.ProcLocalidade && this.state.ProcAmbiente && this.state.ProcAmbientesFilho && this.state.ProcOpcaoRespostra && this.state.ProcTipoItemAmbiente && this.state.ProcTipoResposta){                               
            this.refs.loading.close();                             
          }     
        }                  
      };

      let comando = 'INSERT INTO opcao_resposta_item (cod_opcao_resposta, cod_tipo_item_vistoria, sig_nota, dsc_resposta) VALUES (?, ?, ?, ?); '
      let parametros = [opcaoResposta.cod_opcao_resposta, opcaoResposta.cod_tipo_item_vistoria, opcaoResposta.sig_nota, opcaoResposta.dsc_resposta];   
      this.efetuaInclusao(comando, parametros, chamadaRetorno, "opcao_resposta_item");    

      //Se o ambiente tem lista de tipos de itens, inclui
      if(opcaoResposta.clsTipoNota!= null && opcaoResposta.clsTipoNota!= undefined)
        this.TrataInclusaoTipoNota(opcaoResposta.clsTipoNota); 

    });
  }

  TrataInclusaoTipoNota (tipoNota) {

    var chamadaRetorno = ()=>{};  
         
    chamadaRetorno = ()=>{             
            
      this.setState({ ProcTipoResposta: true});                                           
                    
      if(this.state.ProcLocalidade && this.state.ProcAmbiente && this.state.ProcAmbientesFilho && this.state.ProcOpcaoRespostra && this.state.ProcTipoItemAmbiente && this.state.ProcTipoResposta){                               
        this.refs.loading.close(); 
        
        if(!this.state.alertou){
          Alert.alert("Dados Sicronizados!")   
          this.setState({ alertou: true});
        }                   
      }  

    };

    //inclui tipo de nota da opcao de resposta         
    let comando = 'INSERT INTO tipo_nota (sig_nota, dsc_nome, num_valor) VALUES (?, ?, ?); '
    let parametros = [tipoNota.sig_nota, tipoNota.dsc_nome, tipoNota.num_valor]; 
    this.efetuaInclusao(comando, parametros, chamadaRetorno, "tipo_nota");  
  }

  efetuaPesquisa (comando) {
  
    db.transaction((tx) => {                
      tx.executeSql(comando, null, (tx, resulQuery) => {        
        var len = resulQuery.rows.length;        
        if(len > 0) {
          //existe
          var row = resulQuery.rows.item(0);     
        }          
      });
    });


}

  efetuaInclusao (comando, parametros, chamadaRetorno, tabela) {
    db.transaction((tx) => {     
   
      tx.executeSql(comando, parametros, (tx, resulQuery) => {      
        console.log("####.009-Inserido com sucesso!" + tabela);
      });    
      
    },()=>{}, chamadaRetorno);
  }

  efetuaExclusao (comando) {
    db.transaction((tx) => {      
      tx.executeSql(comando, null, (tx, resulQuery) => {                   
        console.log("Excluído com sucesso");
      });
    });
  }   

}//fim da classe TelaPrincipal


const Navegador = StackNavigator({
  Home: { screen: TelaPrincipal },
  Login: { screen: Login } ,    
});

export default Navegador;
  
const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white',
    },

    img:{
      width: 250,
      height: 250,
    },
    user:{      
      textAlignVertical: 'top'   ,
      color: '#1b3056'        
    }
  });