import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  Alert,
  TouchableOpacity,
  AsyncStorage,
  Storage,
  Image
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import api from '../Servicos/api';
import VistoriaCadastrar from '../Telas/VistoriaCadastrar';
import Questionario from '../Telas/Questionario';
import AmbienteSelecionar from '../Telas/AmbienteSelecionar';
import FotoVistoria from '../Telas/FotoVistoria';
import ScannerVistoria from './ScannerVistoria';
import { NavigationEvents } from "react-navigation";
import Loading from 'react-native-whc-loading';
import Moment from 'moment';

var SQLite = require('react-native-sqlite-storage')

var db = SQLite.openDatabase({name: 'vistoria.db', createFromLocation: '~vistoria.db'})

var ptBrLocale = require('moment/locale/pt-br'); 
Moment.locale('pt-br', ptBrLocale);

export class Vistoria extends Component{
  
  static navigationOptions = ({navigation}) => ({
    title: 'Vistoria',
    headerTitleStyle: {color: '#1b3056'}      
  });

  render(){
    
      return(
      <View style={styles.container}>
      <Loading ref="loading"/>

        <ScrollView style={styles.scrow}>                               

            {/*https://www.techomoro.com/floating-action-button-with-flatlist-in-react-native/*/}
            <FlatList style={styles.flatList}
              data={this.state.vistorias} 
              renderItem={({ item }) => <View style={styles.list}> 
                <Text style={styles.texto}> {item.dsc_localidade}</Text>                                          
                <Text style={styles.texto}> {Moment(item.dth_registro).format('L') }</Text>
                <Text style={styles.texto}>Obs. : {item.txt_observacao}</Text>                 
          
          { item.flg_envio_vistoria != 'S' &&
                <TouchableOpacity onPress={()=> {this.setState({codLocalidade: item.cod_localidade, cod_vistoria: item.cod_vistoria}), this.enviarVistoria(item.cod_localidade, item.cod_vistoria, item.txt_observacao)  } }  style={styles.send}>
                  <Image style={styles.sendIcon} source={require('../img/send.png')} />
                </TouchableOpacity>  
          }

                <TouchableOpacity onPress={()=> {this.setState({codLocalidade: item.cod_localidade, cod_vistoria: item.cod_vistoria}), this.executarVistoria(item.cod_localidade, item.cod_vistoria, item.flg_envio_vistoria)  } }  style={styles.execute}>
                  <Image style={styles.editIcon} source={require('../img/find_in_page.png')} />
                </TouchableOpacity>  

                <TouchableOpacity onPress={()=> {this.setState({cod_vistoria: item.cod_vistoria}), this.confirmacaoExclusao(item.cod_vistoria)  } }   style={styles.delete}>                  
                  <Image style={styles.deletetIcon} source={require('../img/delete.png')} />
                </TouchableOpacity> 
              </View>} 
            />  
         

          <View>
          <NavigationEvents
            onWillFocus={async () => { 
            
              const token = await AsyncStorage.getItem('@Vistoria:token');
              const usuario = JSON.parse(await AsyncStorage.getItem('@Vistoria:usuario'));
              if(token && usuario){
                this.setState({ usuarioLogado: usuario}); 
                this.setState({ token: token}); 
              }
              
            this.refs.loading.show();
            this.carregaVistorias(()=>{                                          
              this.refs.loading.close();
            });   
            }}
          />
        </View>

        </ScrollView>

        <View>
          <TouchableOpacity onPress={this.irNovaVistoria.bind(this)}   style={styles.add}>
          <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity> 
        </View>
      </View>
        
        
      );
    }

    constructor(props){
      super(props);
      this.state = { 
        vistorias: [],   
        codLocalidade: '',     
        lstItemVistoriadoModel: [],    
        lstFotoVistoria: [],  
        teste:'',
        loading: false,
        usuarioLogado: null,
        token: null,  
      }; 
    this.irNovaVistoria = this.irNovaVistoria.bind(this); 
    this.enviar = this.enviarVistoria.bind(this); 
    this.executarVistoria = this.executarVistoria.bind(this); 
    this.excluirVistoria = this.excluirVistoria.bind(this); 
    this.carregaVistorias();
    }
  
    irNovaVistoria(){
      this.props.navigation.navigate('VistoriaCadastrar');
    }

    executarVistoria(cod_localidade, cod_vistoria, flg_envio_vistoria){        
      var titulo = 'Nova Vistoria'  
      if(flg_envio_vistoria == "S"){
        titulo = "Visualizar Vistoria"
      }
      
      this.props.navigation.navigate('AmbienteSelecionar', {cod_localidade, cod_vistoria, flg_envio_vistoria, titulo });
    }
    
    //Acessa API para envio da vistoria 
    enviarVistoria  = async (cod_localidade, cod_vistoria, txt_observacao) => {      
      
      this.refs.loading.show();  

      const usuario = JSON.parse(await AsyncStorage.getItem('@Vistoria:usuario'));

      this.pesquisaFotos(cod_vistoria, async ()=>{

        this.pesquisaInformacoesParaEnvio(cod_vistoria,
          async()=>{      
    
          try{   
                var lstAmbientesVistoriados = this.organizaListaDeItensPorAmbiente();  
                console.log("######################################################################################= " + lstAmbientesVistoriados)
                if(lstAmbientesVistoriados == undefined || lstAmbientesVistoriados == null || lstAmbientesVistoriados == "" ){

                  Alert.alert("Alerta",'Não há ambientes vistoriados para envio')

                }else{
                  var lstFotoVistoriaModel = []

                  lstFotoVistoriaModel = this.state.lstFotoVistoria;  
                                  
                  lstFotoVistoriaModel.forEach(foto => {
                    foto.imagem_array_bytes =  foto.imagem_array_bytes
                    foto.data_imagem = new Date(foto.data_imagem.toString())
                  });                       
          
                  var dth_execucao_vistoria = new Date();
                  this.state.lstItemVistoriadoModel.forEach(itemVistoriado =>{
                    dth_execucao_vistoria = itemVistoriado.dth_execucao_vistoria
                  });
  
                  const response = await api.post('/ServicosAplicativo/EnviarVistoria',  { token: this.state.token,                 
                    cod_localidade: cod_localidade,
                    cod_vistoriador: usuario.cod_usuario,                  
                    dth_execucao_vistoria: new Date(dth_execucao_vistoria.toString()),
                    txt_observacao: txt_observacao,
                    lstAmbienteVistoriadoModel: lstAmbientesVistoriados                  
                  });  
                 
                  if(response.data.sucesso){
  
                    Alert.alert('Enviado com sucesso!')
  
                    //Envia Fotos
                    const response2 = null
                      lstFotoVistoriaModel.forEach(foto => {
                        response2 = api.post('/ServicosAplicativo/EnviarFotoVistoria',  { token: this.state.token,                 
                          cod_vistoria: response.data.data.cod_vistoria,
                          imagem_array_bytes: foto.imagem_array_bytes,  
                          tip_formato_imagem: foto.tip_formato_imagem,
                          observacao: foto.observacao,                
                          data_imagem: foto.data_imagem     
                        });
                      });    
                                          
                      if(response2 != null){
                        if(response2.data != undefined){
  
                          if(response2.data.sucesso){
                            console.log('Foto enviada com sucesso!')
                            this.atualizarFotoVistoriaComoEnviado(response.data.data.cod_vistoria)
                          }else if(response2.data.erroTratado){
                            Alert.alert("Erro", response2.data.msgErro)
                            console.log(response2.data.msgErro)
                          }else{
                            Alert.alert("Erro", "Erro inseperado= " + response2.data.msgErro)
                            console.log("Erro inseperado= " + response2.data.msgErro)
                          } 
                        }   
  
                      }                    
                    
                    //Atualizar vistorias como enviado
                    this.atualizarVistoriaComoEnviado(cod_vistoria)
                    this.carregaVistorias()        
                  }else if(response.data.erroTratado){
                    Alert.alert(response.data.msgErro)
                    console.log(response.data.msgErro)
                  }else{
                    Alert.alert("Erro", "Erro inseperado= " + response.data.msgErro)
                    console.log("Erro inseperado= " + response.data.msgErro)
                  }
                
                }
    
      
          }catch(err){            
            Alert.alert("Erro", "Falha ao acessar serviço" + err) 
            console.log("Falha ao acessar serviço" + err) 
          }finally{
            this.refs.loading.close();  
          }
        })

      });
      
    }  

  organizaListaDeItensPorAmbiente(){

    var ambientesVistoriados = {cod_ambiente: '', lstItemVistoriadoModel: []}
    var lstAmbienteVistoriadoModel = []  


    this.state.lstItemVistoriadoModel.forEach(itemVistoriado => {

      if(ambientesVistoriados.cod_ambiente != itemVistoriado.cod_ambiente){
        ambientesVistoriados = {cod_ambiente: '', lstItemVistoriadoModel: []}
        ambientesVistoriados.cod_ambiente = itemVistoriado.cod_ambiente;
        lstAmbienteVistoriadoModel.push(ambientesVistoriados)
      }
      var itemVistoriadoModel = {cod_tipo_item_vistoria: '', txt_observacao: '', cod_opcao_resposta: ''}

      itemVistoriadoModel.cod_tipo_item_vistoria = itemVistoriado.cod_item_avaliacao
      itemVistoriadoModel.txt_observacao = itemVistoriado.txt_observacao
      itemVistoriadoModel.cod_opcao_resposta = itemVistoriado.cod_opcao_resposta

      ambientesVistoriados.lstItemVistoriadoModel.push(itemVistoriadoModel)

    })
  
    return lstAmbienteVistoriadoModel;

  }


  pesquisaInformacoesParaEnvio(cod_vistoria, chamadaRetorno){         
    //let comando = "SELECT DISTINCT ivs.cod_ambiente, ivs.cod_vistoria, ivs.cod_opcao_resposta, ivs.cod_item_avaliacao, ivs.cod_item_vistoriado, vis.dth_execucao_vistoria from item_vistoriado ivs inner join vistoria vis on ivs.cod_vistoria = vis.cod_vistoria inner join localidade loc on vis.cod_localidade = loc.cod_localidade and vis.flg_envio_vistoria is not 'S'  where ivs.cod_vistoria = ? group by ivs.cod_item_avaliacao;" 
    let comando = "SELECT DISTINCT ivs.cod_ambiente, ivs.cod_vistoria, ivs.cod_opcao_resposta, ivs.cod_item_avaliacao, ivs.cod_item_vistoriado, vis.dth_execucao_vistoria from item_vistoriado ivs inner join vistoria vis on ivs.cod_vistoria = vis.cod_vistoria inner join localidade loc on vis.cod_localidade = loc.cod_localidade and vis.flg_envio_vistoria is not 'S'  where ivs.cod_vistoria = ? group by ivs.cod_ambiente,ivs.cod_item_avaliacao;" 
    let parametros = [cod_vistoria]
    this.efetuaPesquisaVistoria(comando, parametros,chamadaRetorno);
    

  }

  pesquisaFotos(cod_vistoria, chamadaRetorno){
    
    let comando = 'SELECT * from foto_vistoria where cod_vistoria = ?;' 
    let parametros = [cod_vistoria]

    this.efetuaPesquisaFotos(comando, parametros, chamadaRetorno);
  }

  confirmacaoExclusao(cod_vistoria){
    Alert.alert(
      'Exclusão de vistoria',
      'Deseja realmente excluir esta vistoria?',
      [
        {text: 'NÃO', onPress: () => console.warn('NO Pressed'), style: 'cancel'},
        {text: 'SIM', onPress: () => this.excluirVistoria(cod_vistoria)},
      ]
    );
  }

  atualizarVistoriaComoEnviado (cod_vistoria) {
    //atualiza item vistoriado       
    let dth_registro = new Date();  
    let comando = 'UPDATE vistoria SET flg_envio_vistoria = ? where cod_vistoria = ?;'         
    let parametros = ["S", cod_vistoria];                
    this.executaAtualizacao(comando, parametros);    
  }

  atualizarFotoVistoriaComoEnviado (cod_vistoria) {
    //atualiza item vistoriado       
    let dth_registro = new Date();  
    let comando = 'UPDATE vistoria SET flg_envio_fotos = ? where cod_vistoria = ?;'         
    let parametros = ["S", cod_vistoria];                
    this.executaAtualizacao(comando, parametros);    
  }
  
  executaAtualizacao (comando, parametros) {
    db.transaction((tx) => {     
   
      tx.executeSql(comando, parametros, (tx, resulQuery) => {   
        console.log("fotos da vistoria enviadas!")           
      });
  
    });
  }


    excluirVistoria(cod_vistoria){
      console.log("###.000.excluirVistoria-cod_vistoria= " + cod_vistoria);   
      
        comando = 'DELETE FROM item_vistoriado where cod_vistoria = ?;' 
        let parametros = [cod_vistoria];
        this.efetuaExclusao(comando, parametros, ()=>{
          comando = 'DELETE FROM vistoria where cod_vistoria = ?;' 
          parametros = [cod_vistoria];
          this.efetuaExclusao(comando, parametros, ()=> {
            this.refs.loading.show();
  
            this.carregaVistorias(()=>{   
              this.refs.loading.close();
              Alert.alert("Excluído com sucesso");
            })
          });
        })  
       
    }   

    efetuaExclusao (comando, parametros, chamadaRetorno) {
      console.log("comando= " + comando);
      console.log("parametros= " + parametros);   
      db.transaction((tx) => {      
        tx.executeSql(comando, parametros, (tx, resulQuery) => {                          
          console.log("Excluído com sucesso");
        });
      },()=>{}, chamadaRetorno);
    }  
 

    async componentDidMount(){ 

      const token = await AsyncStorage.getItem('@Vistoria:token');
      const usuario = JSON.parse(await AsyncStorage.getItem('@Vistoria:usuario'));
      if(token && usuario){
        this.setState({ usuarioLogado: usuario}); 
        this.setState({ token: token}); 
      }
      
      this.refs.loading.show(); 

      this.carregaVistorias(()=>{       

        this.refs.loading.close();
      });   
    }
    

    efetuaListagemVistorias (comando, chamadaRetorno) {      
      db.transaction((tx) => {                
        tx.executeSql(comando, null, (tx, resulQuery) => {        
          var len = resulQuery.rows.length; 
          
          this.setState({ 
            vistorias: []
          })   

          if(len > 0) {            
            //existe
            //adiciona itens retornados à lista de vistorias                       

            for (let i = 0; i < len; i++) {
              let row = resulQuery.rows.item(i);            
              this.setState({ 
                vistorias: this.state.vistorias.concat([row])
              })
            }
          }          
        });
      },()=>{}, chamadaRetorno);
  
    }

    efetuaPesquisaVistoria (comando, parametros, chamadaRetorno) {            
       db.transaction(async (tx) =>{                                
        
        tx.executeSql(comando, parametros, (tx, resulQuery) => {                  
          var len = resulQuery.rows.length;        
          if(len > 0) {            
            //existe
            //adiciona itens retornados à lista de vistorias   
            this.setState({ 
              lstItemVistoriadoModel: []
            })            

            for (let i = 0; i < len; i++) {
              let row = resulQuery.rows.item(i);            
              this.setState({ 
                lstItemVistoriadoModel: this.state.lstItemVistoriadoModel.concat([row])
                
              })                                       
            } 
          }          
        });
        
      },()=>{}, chamadaRetorno);      
  
    }

    efetuaPesquisaFotos (comando, parametros, chamadaRetorno) {            
      db.transaction(async (tx) =>{     

       tx.executeSql(comando, parametros, (tx, resulQuery) => {        
         
         var len = resulQuery.rows.length;   
   
         if(len > 0) {            
           //existe
           //adiciona fotos retornadas à lista de fotos
           this.setState({ 
            lstFotoVistoria: []
           })            

           for (let i = 0; i < len; i++) {
             let row = resulQuery.rows.item(i);            
             this.setState({ 
               lstFotoVistoria: this.state.lstFotoVistoria.concat([row])
             }) 
           }            
           
         }          
       });
       
     },()=>{}, chamadaRetorno);      
 
   }


    carregaVistorias(chamadaRetorno){     
             
      let comando = "SELECT DISTINCT * FROM vistoria vis inner join localidade loc on vis.cod_localidade = loc.cod_localidade order by dth_registro ;"    
      this.efetuaListagemVistorias(comando, chamadaRetorno);
    }


  }

  const Navegador = StackNavigator({
    Vistoria: { screen: Vistoria },
    AmbienteSelecionar: { screen: AmbienteSelecionar } ,  
    VistoriaCadastrar: { screen: VistoriaCadastrar } ,  
    Questionario: { screen: Questionario },
    FotoVistoria: { screen: FotoVistoria },
    ScannerVistoria: { screen: ScannerVistoria },
  });
  
  export default Navegador;  

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white',      
    },
    scrow: {
      backgroundColor: 'white',       
      alignSelf: 'stretch' 
    },
    list: { 
      margin: 5, 
      backgroundColor: '#1b3056', 
      height: 80, 
      justifyContent: 'space-around', 
      paddingLeft: 10, 
      paddingRight: 60, 
      elevation: 1 ,   
      },  
    flatList: {
      marginBottom: 80,      
    },
    texto: {      
      color: "#0aa8af",
      paddingRight: 60,
      paddingLeft: 5,      
    },    
    send: { 
      position: 'absolute', 
      width: 40, 
      height: 40, 
      alignItems: 'center', 
      justifyContent: 'center', 
      right: 80, 
      bottom: 20, 
      backgroundColor: '#1b3056', 
      borderRadius: 30, 
      elevation: 0 
      }, 
      sendIcon: { 
        fontSize: 25, 
        color: '#0aa8af' 
      },
    execute: { 
      position: 'absolute', 
      width: 40, 
      height: 40, 
      alignItems: 'center', 
      justifyContent: 'center', 
      right: 38, 
      bottom: 20, 
      backgroundColor: '#1b3056', 
      borderRadius: 30, 
      elevation: 0
      }, 
      executeIcon: { 
        fontSize: 25, 
        color: '#0aa8af' 
      },
    delete: { 
      position: 'absolute', 
      width: 40, 
      height: 40, 
      alignItems: 'center', 
      justifyContent: 'center', 
      right: -5, 
      bottom: 20, 
      backgroundColor: '#1b3056', 
      borderRadius: 30, 
      elevation: 0 
      }, 
      deleteIcon: { 
        fontSize: 25, 
        color: '#0aa8af' 
      },
    add: { 
      position: 'absolute', 
      width: 56, 
      height: 56, 
      alignItems: 'center', 
      justifyContent: 'center', 
      right: -160, 
      bottom: 17, 
      backgroundColor: '#0aa8af', 
      borderRadius: 30, 
      elevation: 8 
      }, 
      addIcon: { 
        fontSize: 25, 
        color: 'white' 
      }    
  });