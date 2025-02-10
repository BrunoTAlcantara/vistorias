import React, { Component } from 'react';
import {  
  StyleSheet,
  Text,
  View,  
  Alert,
  Picker,
  ScrollView,
} from 'react-native';
import Botao from '../Componentes/Botao';

var SQLite = require('react-native-sqlite-storage')

var db = SQLite.openDatabase({name: 'vistoria.db', createFromLocation: '~vistoria.db'})

const defaultPlaceholder = '';

export default class Questionario extends Component{
    
  static navigationOptions = ({navigation}) => ({
    title: 'Questionário',
    headerTitleStyle: {color: '#1b3056'}            
  });

  constructor(props){

    
    super(props);
    this.state = {          
      mensagemErro: null,  
      ambienteParaVistoria: [],   
      checked: 0,   
      radioSelected: 1,
      seletorOpcaoID: defaultPlaceholder,  
      lstSeletor: [],
      incluido: false,
      atualizaVistoria: null
    }; 

  this.salvar = this.salvar.bind(this); 
  this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  handleBackButtonClick() {
    this.props.navigation.goBack(null);
   
    this.irAmbienteSelecionar();
    
    return true;
  }

componentWillUnmount() {

  //let atualizaVistoria = this.state.atualizaVistoria;
  let atualizaVistoria = this.props.navigation.state.params.atualizaVistoria  

  if(typeof atualizaVistoria === 'function'){
    atualizaVistoria();
  }
}

  async componentWillMount(){   
    
  }

  //recebe parametros da navegação entre telas
  componentWillReceiveProps(nextProps){
    this.setState({ambienteParaVistoria: nextProps.navigation.state.params.ambienteParaVistoria}) 
    this.setState({codVistoria: nextProps.navigation.state.params.codVistoria})    
    this.setState({atualizaVistoria: nextProps.navigation.state.params.atualizaVistoria})    
  }  

  radioClick(id) {
    this.setState({
      radioSelected: id
    })
  }

  criarSeletorOpcoesResposta(lstOpcaoRespostaItem, cod_item){     
  
    return  <View >                  
              <Picker
                    mode='dropdown'
                    style={{width: '80%', marginLeft: 30, color: '#0aa8af', marginRight: 30}}
                    selectedValue={this.retornaOpcaoIDcorrepondente(cod_item)}
                    //selectedValue={this.state.seletorOpcaoID}
                    //selectedValue={lstOpcaoRespostaItem.cod_tipo_item_vistoria}
                    onValueChange={(itemValue, _itemIndex) => {
                      
                      //this.setState({seletorOpcaoID: itemValue})
                      this.salvaStateCorrespondente(cod_item, itemValue)
                    }}
                >
                <Picker.Item label={defaultPlaceholder} value={defaultPlaceholder}/>
                  {this.renderizarOpcoes(lstOpcaoRespostaItem)}
                </Picker>
            </View>       
;                                   
}


renderizarOpcoes = (lstOpcaoRespostaItem) => lstOpcaoRespostaItem.map(a => {
  return <Picker.Item key={a.cod_opcao_resposta} label={a.dsc_resposta} value={a.cod_opcao_resposta}/>;
});

retornaOpcaoIDcorrepondente(cod_item){  
  var seletorId = 0 
 
  try{
    return  seletorId = this.state.lstSeletor[cod_item] 
  }catch(err){
    Alert.alert("Erro" + err)
    return seletorId = -1
  }
    

}

salvaStateCorrespondente(cod_item, itemValue){


  let lstSeletor = [ ...this.state.lstSeletor ];
  lstSeletor[cod_item] = itemValue;
  this.setState({ lstSeletor }); 
  
}

//Acessa API para autenticar usuário 
salvar = async () =>{  
  

  if(!this.validaQuestionario()){
    Alert.alert("Alerta","Você deve responder pelo menos um item no questionário para poder salvar") 
  }else{
    this.props.navigation.state.params.ambienteParaVistoria.lstTipoItemVistoria.forEach( itemVistoria => {    
      itemVistoria.lstOpcaoRespostaItem.forEach(opcaoRespostaItem => {      
        if(opcaoRespostaItem.cod_opcao_resposta == this.retornaOpcaoIDcorrepondente(itemVistoria.cod_tipo_item_vistoria)){
          this.TratarInclusaoItemVistoriado(this.props.navigation.state.params.ambienteParaVistoria.cod_ambiente, this.props.navigation.state.params.codVistoria, opcaoRespostaItem.cod_opcao_resposta, itemVistoria.cod_tipo_item_vistoria);
        }      
      });
    });
  }    
  
};

validaQuestionario(){
  var valido = false

  this.props.navigation.state.params.ambienteParaVistoria.lstTipoItemVistoria.forEach( itemVistoria => {  
    console.log("##########################.001-TESTE OPCAO QUESTIONARIO= " +this.retornaOpcaoIDcorrepondente(itemVistoria.cod_tipo_item_vistoria)) 
    if(this.retornaOpcaoIDcorrepondente(itemVistoria.cod_tipo_item_vistoria) != undefined && this.retornaOpcaoIDcorrepondente(itemVistoria.cod_tipo_item_vistoria) != ""){
      valido = true
    }   
  });

  return valido
}

TratarInclusaoAmbiente (ambiente) {
  //inclui ambiente    
  let comando = 'INSERT INTO ambiente_localidade (cod_ambiente, cod_ambiente_pai, cod_localidade, dsc_ambiente, cod_categoria_ambiente) VALUES (?, ?, ?, ?, ?);'         
  let parametros = [ambiente.cod_ambiente, ambiente.cod_ambiente_pai, ambiente.cod_localidade, ambiente.dsc_ambiente, ambiente.clsCategoriaAmbiente.cod_categoria_ambiente];                   
  this.efetuaInclusao(comando, parametros);    
  console.log ("Felipe: Mostra comando de insert ambiente: ");
    console.log (parametros);
}

TratarInclusaoItemVistoriado (cod_ambiente, cod_vistoria, cod_opcao_resposta, cod_item_avaliacao) {
  //inclui item vistoriado       
  let dth_registro = new Date();  
  let comando = 'INSERT INTO item_vistoriado (cod_ambiente, cod_vistoria, cod_opcao_resposta, cod_item_avaliacao, dth_registro) VALUES ( ?, ?, ?, ?, ?);'         
  let parametros = [cod_ambiente, cod_vistoria, cod_opcao_resposta, cod_item_avaliacao, dth_registro];  
                
  this.efetuaInclusao(comando, parametros);   
  console.log ("Felipe: Mostra comando de insert itens v: ");
  console.log (parametros); 
}

efetuaInclusao (comando, parametros) {
  db.transaction((tx) => {     
 
    tx.executeSql(comando, parametros, (tx, resulQuery) => {   
      Alert.alert("Ambiente vistoriado com sucesso!")   
      console.log("Ambiente vistoriado com sucesso!");
      this.setState({incluido: true})
    });

  });
}
   
irAmbienteSelecionar(){  
  this.props.navigation.navigate('AmbienteSelecionar',{cod_localidade: this.state.ambienteParaVistoria.cod_localidade, cod_vistoria: this.state.codVistoria, titulo: 'Vistoria Cadastrar'} );
}
    
    render() {

      return (
    <View style={styles.container}>
      <Text style={{fontWeight: "bold", color: '#0aa8af', fontSize: 19, marinTop: 10, marginBottom:15}}>{this.props.navigation.state.params.ambienteParaVistoria.dsc_ambiente}</Text>
        <ScrollView style={styles.scrow}>
     
                {this.props.navigation.state.params.ambienteParaVistoria.lstTipoItemVistoria.map(itemVistoria => {
                    
                    return <View>
                    
                    <Text style={{fontSize: 16.5, textAlign: 'left', marginLeft: 30, color: '#0aa8af'}} key={itemVistoria.cod_tipo_item_vistoria}> {itemVistoria.dsc_item} </Text>

                            {this.criarSeletorOpcoesResposta(itemVistoria.lstOpcaoRespostaItem, itemVistoria.cod_tipo_item_vistoria)}

                    </View>

                })
                
                }

          <View style={styles.container}>          
            <Botao cor="#0aa8af" nome="Salvar" onPress={this.salvar.bind(this)} />  
          </View>     

        </ScrollView>
    </View>
        
                
      );
      
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
      alignSelf: 'stretch' 
    },    
    input:{
      width: 350,
      height: 50,
      backgroundColor: '#CCC',
      fontSize: 22,
      padding: 5,
      margin: 5
    },
    radioButtonUnselected:{
      height: 24,
      width: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#000',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioButtonSelected:{
      height: 12,
      width: 12,
      borderRadius: 6,
      backgroundColor: '#000',
    },
    img:{
      height:20,
      width: 20
    },
    btn:{
      flexDirection: 'row'
    }
  });