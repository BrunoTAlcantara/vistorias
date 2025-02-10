import React, { Component } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image, Alert } from "react-native";
import { RNCamera } from "react-native-camera";

var SQLite = require('react-native-sqlite-storage')
var db = SQLite.openDatabase({name: 'vistoria.db', createFromLocation: '~vistoria.db'})

export default class FotoVistoria extends Component {


  constructor(props){

    
    super(props);
    this.state = {    
      ambienteParaVistoria: null,  
      codVistoria: null,
      codItemVistoriado: false,
      atualizaVistoria: null
    }; 

  //this.salvar = this.salvar.bind(this); 
  this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  //Botão voltar do android
  handleBackButtonClick() {
    this.props.navigation.goBack(null);
   
    this.irAmbienteSelecionar();
    
    return true;
  }

  // ao sair da tela
  componentWillUnmount() {

    //let atualizaVistoria = this.state.atualizaVistoria;
    let atualizaVistoria = this.props.navigation.state.params.atualizaVistoria  
  
    if(typeof atualizaVistoria === 'function'){
      atualizaVistoria();
    }
  }
    
    //recebe parametros da navegação entre telas
  componentWillReceiveProps(nextProps){
    this.setState({ambienteParaVistoria: nextProps.navigation.state.params.ambienteParaVistoria}) 
    this.setState({codVistoria: nextProps.navigation.state.params.codVistoria})    
    this.setState({codItemVistoriado: nextProps.navigation.state.params.codItemVistoriado})  
    this.setState({atualizaVistoria: nextProps.navigation.state.params.atualizaVistoria})    
  } 

  takePicture = async () => {
    try{
        if (this.camera) {
            const options = { quality: 0.5, base64: true };
            const data = await this.camera.takePictureAsync(options);

            this.tratarFotoVistoria(data.uri, data, ()=>{               
                
                Alert.alert("Imagem salva com sucesso! ");                 
            
                //this.irSelecaodeAmbientes();

            })
        }
    }catch(err){
        Alert.alert("Erro na câmera= " + err);
        console.log("Erro na câmera= " + err);
    }
    
  };

  irSelecaodeAmbientes(){
    this.props.navigation.navigate('AmbienteSelecionar', {ambienteParaVistoria: this.state.ambienteParaVistoria, codVistoria: codVistoria});
  }

  tratarFotoVistoria (uriImagem, imagemArrayBytes, chamadaRetorno) {
    //inclui foto de uma vistoria e ou ambiente
    var codItemVistoriado = 0
    if (this.props.navigation.state.params.codItemVistoriado != undefined)    
        codItemVistoriado = this.props.navigation.state.params.codItemVistoriado
    
    var tipFormatoImagem = this.retornaFormato(uriImagem)  
    

    let dth_registro = new Date();  
    let comando = 'INSERT INTO foto_vistoria (cod_vistoria, cod_item_vistoriado, imagem, data_imagem, tip_formato_imagem, observacao, imagem_array_bytes) VALUES ( ?, ?, ?, ?, ?, ?, ?);'         
    let parametros = [this.props.navigation.state.params.codVistoria, codItemVistoriado, uriImagem, dth_registro, tipFormatoImagem, '', imagemArrayBytes.base64];      
    this.efetuaInclusao(comando, parametros, chamadaRetorno);    
  }

  retornaFormato(uriImagem){
    var tipFormatoImagem = '';

    if(uriImagem.toUpperCase().includes("PNG")){
        tipFormatoImagem = 'PNG';
    }else if(uriImagem.toUpperCase().includes("JPG")){
        tipFormatoImagem = 'JPG';        
    }else if(uriImagem.toUpperCase().includes("GIF")){
        tipFormatoImagem = 'GIF';
    }else if(uriImagem.toUpperCase().includes("TIF")){
        tipFormatoImagem = 'TIF';
    }else if(uriImagem.toUpperCase().includes("BMP")){
        tipFormatoImagem = 'BMP';
    }else if(uriImagem.toUpperCase().includes("EPS")){
        tipFormatoImagem = 'EPS';
    }else if(uriImagem.toUpperCase().includes("PDF")){
        tipFormatoImagem = 'PDF';
    }

    return tipFormatoImagem;
  }
  
  efetuaInclusao (comando, parametros, chamadaRetorno) {
    
    db.transaction((tx) => {        
      tx.executeSql(comando, parametros, (tx, resulQuery) => {           
        
      });
  
    },()=>{}, chamadaRetorno);
  }   

  render() {
    return (
      <View style={styles.container}>
        <RNCamera
          ref={camera => {
            this.camera = camera;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          autoFocus={RNCamera.Constants.AutoFocus.on}
          flashMode={RNCamera.Constants.FlashMode.off}
          permissionDialogTitle={"Permission to use camera"}
          permissionDialogMessage={
            "We need your permission to use your camera phone"
          }
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={this.takePicture} style={styles.capture}>
            <Image style={styles.captureIcon} source={require('../img/capture2.png')} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "black"
  },
  preview: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center"
  },
  buttonContainer: {
    flex: 0,
    flexDirection: "row",
    justifyContent: "center"
  },
  capture: {
    flex: 0,
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: "center",
    margin: 20
  },
  buttonText: {
    fontSize: 14
  }
});