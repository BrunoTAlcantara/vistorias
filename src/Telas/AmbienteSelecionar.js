import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  AsyncStorage,
  Picker,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  BackHandler,
  CameraRoll,
} from "react-native";
import { RNCamera } from "react-native-camera";
import Loading from "react-native-whc-loading";

var SQLite = require("react-native-sqlite-storage");

var db = SQLite.openDatabase({
  name: "vistoria.db",
  createFromLocation: "~vistoria.db",
});

const defaultPlaceholder = "";

export default class AmbienteVistoriar extends Component {
  static navigationOptions = ({ navigation }) => ({
    //title: 'Nova Vistoria',
    title: navigation.state.params.titulo,
    headerTitleStyle: { color: "#1b3056" },
  });

  constructor(props) {
    super(props);
    this.state = {
      usuarioLogado: null,
      mensagemErro: null,
      codigoBusca: "",
      localidades: [],
      cod_localidade: "",
      ambientes: [],
      ambientesFilho1: [],
      ambientesFilho2: [],
      ambientesFilho3: [],
      ambientesFilho4: [],
      seletorLocalidadeID: defaultPlaceholder,
      seletorAmbienteID: defaultPlaceholder,
      seletorAmbiente1ID: defaultPlaceholder,
      seletorAmbiente2ID: defaultPlaceholder,
      seletorAmbiente3ID: defaultPlaceholder,
      seletorAmbiente4ID: defaultPlaceholder,
      listaVazia: [],
      ambienteParaVistoria: null,
      nomebtnVistoriar: "VISTORIAR ",
      nomeAmbienteVistoria: "",
      cod_vistoria: "",
      ambientesVistoriados: [],
      fotos: [],
      editar: false,
      comentario: "",
      cod_foto: 0,
      flg_envio_vistoria: "",
    };
    this.vistoriar = this.vistoriar.bind(this);
    this.excluirAmbiente = this.excluirAmbiente.bind(this);
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    this.debounceTimeout = null;
  }

  handleBackButtonClick() {
    this.props.navigation.goBack(null);
    this.carregarItensVistoriados();
    this.carregarFotos(() => {
      this.refs.loading.close();
    });
    return true;
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      "hardwareBackPress",
      this.handleBackButtonClick
    );
  }

  async componentWillMount() {
    BackHandler.addEventListener(
      "hardwareBackPress",
      this.handleBackButtonClick
    );

    const localidades = JSON.parse(
      await AsyncStorage.getItem("@Vistoria:localidades")
    );
    if (localidades) {
      this.setState({ localidades: localidades });
    }
    console.log(
      "#################################################################################################### AKI 1 "
    );
    console.log(
      "###.001.componentWillMount.this.state.cod_localidade= " +
        this.props.navigation.state.params.cod_localidade
    );
    this.verificaAmbientesPorLocalidade(
      this.props.navigation.state.params.cod_localidade
    );
  }

  async componentDidMount() {
    const { navigation } = this.props;

    BackHandler.addEventListener(
      "hardwareBackPress",
      this.handleBackButtonClick
    );

    const localidades = JSON.parse(
      await AsyncStorage.getItem("@Vistoria:localidades")
    );
    if (localidades) {
      this.setState({ localidades: localidades });
    }
    console.log(
      "#################################################################################################### AKI 2 "
    );
    this.verificaAmbientesPorLocalidade(
      this.props.navigation.state.params.cod_localidade
    );

    this.refs.loading.show();

    this.carregarItensVistoriados();
    this.carregarFotos(() => {
      this.refs.loading.close();
    });
  }

  handleInputChange = (text) => {
    this.setState({ codigoFilho: text });

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      if (text.length > 3) {
        this.atualizarSeletoresPorCodigoFilho(Number(text));
      }
    }, 1000);
  };

  carregarItensVistoriados() {
    //let comando = 'SELECT ivs.cod_ambiente, amb.dsc_ambiente FROM item_vistoriado ivs inner join vistoria vis on ivs.cod_vistoria = vis.cod_vistoria inner join ambiente_localidade amb on amb.cod_localidade = vis.cod_localidade and amb.cod_ambiente = ivs.cod_ambiente inner join localidade loc on amb.cod_localidade = loc.cod_localidade where vis.cod_vistoria = ? and vis.flg_envio_vistoria is not ? group by ivs.cod_ambiente;'
    //let parametros = [this.props.navigation.state.params.cod_vistoria, 'S'];
    let comando =
      "SELECT ivs.cod_ambiente, amb.dsc_ambiente FROM item_vistoriado ivs inner join vistoria vis on ivs.cod_vistoria = vis.cod_vistoria inner join ambiente_localidade amb on amb.cod_localidade = vis.cod_localidade and amb.cod_ambiente = ivs.cod_ambiente inner join localidade loc on amb.cod_localidade = loc.cod_localidade where vis.cod_vistoria = ? group by ivs.cod_ambiente;";
    let parametros = [this.props.navigation.state.params.cod_vistoria];
    this.listaItens(comando, parametros);
  }

  carregarFotos(chamadaRetorno) {
    let comando = "SELECT * from foto_vistoria where cod_vistoria = ?;";
    let parametros = [this.props.navigation.state.params.cod_vistoria];
    this.efetuaPesquisaFotos(comando, parametros, chamadaRetorno);
  }

  verificaItemVistoriado(cod_ambiente) {
    var retorno = false;

    this.state.ambientesVistoriados.forEach((ambiente) => {
      if (ambiente.cod_ambiente == cod_ambiente) {
        Alert.alert("Ambiente já foi vistoriado! Selecione outro");
        retorno = true;
      }
    });

    return retorno;
  }


  componentWillReceiveProps(nextProps) {
    this.setState({
      cod_localidade: nextProps.navigation.state.params.cod_localidade,
    });
    this.setState({
      cod_vistoria: nextProps.navigation.state.params.cod_vistoria,
    });
    this.setState({
      flg_envio_vistoria: nextProps.navigation.state.params.flg_envio_vistoria,
    });
  }

  listaItens(comando, parametros) {
    db.transaction((tx) => {
      tx.executeSql(comando, parametros, (tx, resulQuery) => {
        var len = resulQuery.rows.length;

        this.setState({
          ambientesVistoriados: [],
        });

        if (len > 0) {
          for (let i = 0; i < len; i++) {
            let row = resulQuery.rows.item(i);
            this.setState({
              ambientesVistoriados: this.state.ambientesVistoriados.concat([
                row,
              ]),
            });
          }
        }
      });
    });
  }

  efetuaPesquisaFotos(comando, parametros, chamadaRetorno) {
    db.transaction(
      (tx) => {
        tx.executeSql(comando, parametros, (tx, resulQuery) => {
          var len = resulQuery.rows.length;

          this.setState({
            fotos: [],
          });

          if (len > 0) {
            //existe
            //adiciona itens retornados à lista de vistorias

            for (let i = 0; i < len; i++) {
              let row = resulQuery.rows.item(i);
              this.setState({
                fotos: this.state.fotos.concat([row]),
              });
            }
          }
        });
      },
      () => {},
      chamadaRetorno
    );
  }

  buscarAmbientePorCodigoInput = (codigo) => {
    this.setState({
      seletorAmbienteID: "",
      seletorAmbiente1ID: "",
      seletorAmbiente2ID: "",
      ambientesFilho1: [],
      ambientesFilho2: [],
    });

    this.atualizarSeletoresPorCodigoFilho(Number(codigo));
  };

  buscarAmbientePorCodigo(codigo, ambientes) {
    for (const ambiente of ambientes) {
      if (ambiente.cod_ambiente === codigo) {
        return ambiente;
      }
      if (ambiente.lstAmbientesFilho && ambiente.lstAmbientesFilho.length > 0) {
        const encontrado = this.buscarAmbientePorCodigo(
          codigo,
          ambiente.lstAmbientesFilho
        );
        if (encontrado) {
          return encontrado;
        }
      }
    }
    return null;
  }

  irFotoVistoria() {
    let codVistoria = this.props.navigation.state.params.cod_vistoria;
    this.props.navigation.navigate("FotoVistoria", {
      ambienteParaVistoria: this.state.ambienteParaVistoria,
      codVistoria: codVistoria,
      atualizaVistoria: () => {
        this.refs.loading.show();
        this.carregarItensVistoriados();
        this.carregarFotos(() => {
          this.refs.loading.close();
        });
      },
    });
  }

  irScannerVistoria = () => {
    this.props.navigation.navigate("ScannerVistoria", {
      atualizarCode: (code) => {

        this.buscarAmbientePorCodigoInput(code)
      },
    });
  };

  encontrarHierarquiaAmbiente = (codigo, ambientes) => {
    for (const ambiente of ambientes) {
      if (ambiente.cod_ambiente === codigo) {
        return [ambiente];
      }

      if (ambiente.lstAmbientesFilho && ambiente.lstAmbientesFilho.length > 0) {
        const hierarquia = this.encontrarHierarquiaAmbiente(
          codigo,
          ambiente.lstAmbientesFilho
        );
        if (hierarquia) {
          return [ambiente, ...hierarquia];
        }
      }
    }
    return null;
  };

  atualizarSeletoresPorCodigoFilho = (codigoFilho) => {
    const { localidades } = this.state;
    let hierarquia = null;

    for (const localidade of localidades) {
      hierarquia = this.encontrarHierarquiaAmbiente(
        codigoFilho,
        localidade.lstAmbiente
      );
      if (hierarquia) break;
    }
  
    if (hierarquia) {
      try {
        this.setState(
          {
            seletorAmbienteID:
              (hierarquia.length > 0 && hierarquia[0] && hierarquia[0].cod_ambiente) ||
              defaultPlaceholder,
            seletorAmbiente1ID:
              (hierarquia.length > 1 && hierarquia[1] && hierarquia[1].cod_ambiente) ||
              defaultPlaceholder,
            seletorAmbiente2ID:
              (hierarquia.length > 2 && hierarquia[2] && hierarquia[2].cod_ambiente) ||
              defaultPlaceholder,
            ambientesFilho1:
              (hierarquia.length > 0 && hierarquia[0] && hierarquia[0].lstAmbientesFilho) || [],
            ambientesFilho2:
              (hierarquia.length > 1 && hierarquia[1] && hierarquia[1].lstAmbientesFilho) || [],
          },
          () => {
            if (hierarquia.length > 2 && hierarquia[2] && hierarquia[2].cod_ambiente) {
              this.ativarAmbienteParaVistoria(hierarquia[2].cod_ambiente, 2);
            }
          }
        );
      } catch (error) {
        Alert.alert("Erro", "Ambiente filho não encontrado.");
      }
    } else {
      Alert.alert("Erro", "Ambiente não encontrado.");
    }
  };
  

  render() {
    ///*
    return (
      <View style={styles.container}>
        <Loading ref="loading" />
        <ScrollView style={styles.scrow}>
          <View>
            {this.props.navigation.state.params.flg_envio_vistoria != "S" && (
            <View style={{ marginBottom: 20, marginTop: 20 }}>
            <Text style={{ fontSize: 16, color: "#0aa8af", marginLeft: 10 }}>
              Código do ambiente:
            </Text>
            <TextInput
              style={{
                fontSize: 16.5,
                textAlign: "left",
                marginLeft: 10,
                width: '85%',
                color: "#0aa8af",
              }}
              onChangeText={this.handleInputChange}
              placeholder="Digite o código do ambiente"
              keyboardType="numeric"
            />
          </View>          
            )}

            {this.props.navigation.state.params.flg_envio_vistoria != "S" && (
              <Text
                style={{
                  fontSize: 16.5,
                  textAlign: "left",
                  marginLeft: 10,
                  color: "#0aa8af",
                }}
              >
                {" "}
                Ambiente{" "}
              </Text>
            )}
            {this.props.navigation.state.params.flg_envio_vistoria != "S" &&
              this.criarSeletorAmbientes()}

            {this.props.navigation.state.params.flg_envio_vistoria != "S" && (
              <Text
                style={{
                  fontSize: 16.5,
                  textAlign: "left",
                  marginLeft: 10,
                  color: "#0aa8af",
                }}
              >
                {" "}
                Ambiente nível 2
              </Text>
            )}

            {this.props.navigation.state.params.flg_envio_vistoria != "S" &&
              this.criarSeletorAmbienteFilho1()}

            {this.props.navigation.state.params.flg_envio_vistoria != "S" && (
              <Text
                style={{
                  fontSize: 16.5,
                  textAlign: "left",
                  marginLeft: 10,
                  color: "#0aa8af",
                }}
              >
                {" "}
                Ambiente nível 3
              </Text>
            )}

            {this.props.navigation.state.params.flg_envio_vistoria != "S" &&
              this.criarSeletorAmbienteFilho2()}

            {/* 
                    <Text style={{fontSize: 16.5, textAlign: 'left', marginLeft: 10, color: '#0aa8af'}}> Ambiente nível 4</Text>
                  {this.criarSeletorAmbienteFilho3()} 
  */}
          </View>

          <View style={styles.container}>
            <FlatList
              data={this.state.ambientesVistoriados}
              renderItem={({ item }) => (
                <View style={styles.list}>
                  <Text style={{ color: "#0aa8af" }}> {item.dsc_ambiente}</Text>

                  {this.props.navigation.state.params.flg_envio_vistoria !=
                    "S" && (
                    <TouchableOpacity
                      onPress={() => {
                        this.setState({ codLocalidade: item.cod_ambiente }),
                          this.confirmacaoExclusao(item.cod_ambiente, 0);
                      }}
                      style={styles.delete}
                    >
                      <Image
                        style={styles.deleteIcon}
                        source={require("../img/delete.png")}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          </View>

          {/* this.props.navigation.state.params.flg_envio_vistoria == 'S' &&
                <View style={styles.container}>   
                <FlatList 
                  data={this.state.ambientesVistoriados} 
                  renderItem={({ item }) => <View style={styles.list}> 
                  <Text style={{color: '#0aa8af'}}> {item.dsc_ambiente}</Text>   

                  </View>} 
                />  
                </View>  
                */}

          <View style={styles.container}>
            <FlatList
              style={styles.flatList}
              data={this.state.fotos}
              renderItem={({ item }) => (
                <View style={styles.listaImagens}>
                  <ImageBackground
                    resizeMode="cover"
                    source={{ uri: item.imagem }}
                    style={{ height: 410, width: 300 }}
                  >
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingLeft: 10,
                        paddingBottom: 10,
                      }}
                    ></View>
                  </ImageBackground>

                  {this.props.navigation.state.params.flg_envio_vistoria !=
                    "S" && (
                    <TouchableOpacity
                      onPress={() => {
                        this.confirmacaoExclusao(0, item.cod_foto);
                      }}
                      style={styles.delete}
                    >
                      <Image
                        style={styles.deleteIcon}
                        source={require("../img/delete.png")}
                      />
                    </TouchableOpacity>
                  )}

                  {this.props.navigation.state.params.flg_envio_vistoria !=
                    "S" && (
                    <TouchableOpacity
                      onPress={() => {
                        this.setState({ cod_foto: item.cod_foto }),
                          this.adicionarComentarioFoto();
                      }}
                      style={styles.edit}
                    >
                      <Image
                        style={styles.editIcon}
                        source={require("../img/ic_add_comment.png")}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          </View>
        </ScrollView>

        <RNCamera
          ref={(ref) => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
          permissionDialogTitle={"Permissão para utilizar a câmera"}
          permissionDialogMessage={
            "Nós precisamos da sua permissão para utilizar a câmera"
          }
          onGoogleVisionBarcodesDetected={({ barcodes }) => {
            console.log(barcodes);
          }}
        />

        {this.state.editar && (
          <View
            style={{
              flexDirection: "column",
              alignItems: "center",
              marginVertical: 10,
            }}
          >
            <TextInput
              style={styles.input}
              placeholder="Comentário"
              underlineColorAndroid="transparent"
              onChangeText={(comentario) => {
                this.setState({ comentario });
              }}
            />
            <TouchableOpacity
              onPress={() => {
                this.salvarComentarioFoto();
              }}
              style={styles.save}
            >
              <Image
                style={styles.saveIcon}
                source={require("../img/ic_save_white.png")}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Ícones de Ação */}
        {this.props.navigation.state.params.flg_envio_vistoria != "S" && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginVertical: 10,
            }}
          >
            <TouchableOpacity
              onPress={this.vistoriar.bind(this)}
              style={styles.inspect}
            >
              <Image
                style={styles.inspectIcon}
                source={require("../img/inspecaoBranco24.png")}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={this.irFotoVistoria.bind(this)}
              style={styles.capture}
            >
              <Image
                style={styles.captureIcon}
                source={require("../img/camera24.png")}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={this.irScannerVistoria.bind(this)}
              style={styles.scannerOverlay}
            >
              <Image
                style={styles.scannerIcon}
                source={require("../img/icons-scanner.png")}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  confirmacaoExclusao(cod_ambiente, cod_foto) {
    if (cod_ambiente > 0) {
      Alert.alert(
        "Exclusão de ambiente",
        "Deseja realmente excluir este ambiente?",
        [
          {
            text: "NÃO",
            onPress: () => console.warn("NO Pressed"),
            style: "cancel",
          },
          { text: "SIM", onPress: () => this.excluirAmbiente(cod_ambiente) },
        ]
      );
    } else {
      Alert.alert("Exclusão de foto", "Deseja realmente excluir esta foto?", [
        {
          text: "NÃO",
          onPress: () => console.warn("NO Pressed"),
          style: "cancel",
        },
        { text: "SIM", onPress: () => this.excluirFoto(cod_foto) },
      ]);
    }
  }

  adicionarComentarioFoto() {
    this.setState({ editar: !this.state.editar });
  }

  /*
    _toggleModal = (cod_foto) =>{
      this.setState({ isModalVisible: !this.state.isModalVisible });

      if(!this.state.isModalVisible){
        this.salvarComentarioFoto(cod_foto);
        this.setState({comentario: ''});
      }
    }
    */

  salvarComentarioFoto() {
    comando = "UPDATE foto_vistoria set observacao = ? where cod_foto = ?;";
    let parametros = [this.state.comentario, this.state.cod_foto];
    this.efetuaAlteracao(comando, parametros, () => {
      this.refs.loading.show();

      this.carregarItensVistoriados();

      this.carregarFotos(() => {
        this.refs.loading.close();
        this.setState({ comentario: "" });
        Alert.alert("Comentário adicionado");
        this.setState({ editar: !this.state.editar });
      });
    });
  }

  excluirAmbiente(cod_ambiente) {
    console.log("cod_ambiente= " + cod_ambiente);

    comando =
      "DELETE FROM item_vistoriado where cod_ambiente = ? and cod_vistoria = ?;";
    let parametros = [
      cod_ambiente,
      this.props.navigation.state.params.cod_vistoria,
    ];
    this.efetuaExclusao(comando, parametros, () => {
      this.refs.loading.show();

      this.carregarItensVistoriados();

      this.carregarFotos(() => {
        this.refs.loading.close();
        Alert.alert("Excluído com sucesso");
      });
    });
  }

  excluirFoto(cod_foto) {
    console.log("cod_foto= " + cod_foto);

    comando = "DELETE FROM foto_vistoria where cod_foto = ?;";
    let parametros = [cod_foto];
    this.efetuaExclusao(comando, parametros, () => {
      this.refs.loading.show();

      this.carregarItensVistoriados();

      this.carregarFotos(() => {
        this.refs.loading.close();
        Alert.alert("Excluído com sucesso");
      });
    });
  }

  efetuaExclusao(comando, parametros, chamadaRetorno) {
    db.transaction(
      (tx) => {
        tx.executeSql(comando, parametros, (tx, resulQuery) => {});
      },
      () => {},
      chamadaRetorno
    );
  }

  efetuaAlteracao(comando, parametros, chamadaRetorno) {
    db.transaction(
      (tx) => {
        tx.executeSql(comando, parametros, (tx, resulQuery) => {});
      },
      () => {},
      chamadaRetorno
    );
  }

  //Inclui nova vistoria
  vistoriar = async () => {
    if (this.state.ambienteParaVistoria == null) {
      Alert.alert("Nenhum ambiente com itens para vistoria foi selecionado!");
    } else {
      if (
        !this.verificaItemVistoriado(
          this.state.ambienteParaVistoria.cod_ambiente
        )
      ) {
        let codVistoria = this.props.navigation.state.params.cod_vistoria;
        this.props.navigation.navigate("Questionario", {
          ambienteParaVistoria: this.state.ambienteParaVistoria,
          codVistoria: codVistoria,
          atualizaVistoria: () => {
            ///*
            this.refs.loading.show();
            this.carregarItensVistoriados();
            this.carregarFotos(() => {
              this.refs.loading.close();
            });
            //*/
            //Alert.alert("voltou")
          },
        });
      }
    }
  };

  //teste------------------
  //https://stackoverflow.com/questions/52840954/react-native-picker-onvaluechange-triggers-unintended-onvaluechange-for-other-p

  renderizarLocalidades = () =>
    this.state.localidades.map((a) => {
      return (
        <Picker.Item
          key={a.cod_localidade}
          label={a.dsc_localidade}
          value={a.cod_localidade}
        />
      );
    });

  renderizarAmbientes = () =>
    this.state.ambientes.map((a) => {
      return (
        <Picker.Item
          key={a.cod_ambiente}
          label={a.dsc_ambiente}
          value={a.cod_ambiente}
          color="#0aa8af"
        />
      );
    });

  renderizarAmbientes1 = () =>
    this.state.ambientesFilho1.map((a) => {
      return (
        <Picker.Item
          key={a.cod_ambiente}
          label={a.dsc_ambiente}
          value={a.cod_ambiente}
          color="#0aa8af"
        />
      );
    });

  renderizarAmbientes2 = () =>
    this.state.ambientesFilho2.map((a) => {
      return (
        <Picker.Item
          key={a.cod_ambiente}
          label={a.dsc_ambiente}
          value={a.cod_ambiente}
          color="#0aa8af"
        />
      );
    });

  renderizarAmbientes3 = () =>
    this.state.ambientesFilho3.map((a) => {
      return (
        <Picker.Item
          key={a.cod_ambiente}
          label={a.dsc_ambiente}
          value={a.cod_ambiente}
          color="#0aa8af"
        />
      );
    });

  //Cria seletor de localidades dinamicamente
  criarSeletorLocalidades() {
    return (
      <View>
        <Picker
          mode="dropdown"
          style={{ width: "80%", marginLeft: 30 }}
          selectedValue={this.state.seletorLocalidadeID}
          onValueChange={(itemValue, _itemIndex) => {
            this.setState({ seletorLocalidadeID: itemValue });
            this.verificaAmbientesPorLocalidade(itemValue);
          }}
        >
          <Picker.Item label={defaultPlaceholder} value={defaultPlaceholder} />
          {this.renderizarLocalidades()}
        </Picker>
      </View>
    );
  }

  //Cria seletor de ambiente dinamicamente
  criarSeletorAmbientes() {
    return (
      <View>
        <Picker
          mode="dropdown"
          style={{ width: "90%", marginLeft: 10, color: "#0aa8af" }}
          selectedValue={this.state.seletorAmbienteID}
          onValueChange={(itemValue, _itemIndex) => {
            this.setState({ seletorAmbienteID: itemValue });
            this.verificaAmbientesFilhoPorAmbiente(itemValue);
            this.ativarAmbienteParaVistoria(itemValue, 0);
          }}
        >
          <Picker.Item label={defaultPlaceholder} value={defaultPlaceholder} />
          {this.renderizarAmbientes()}
        </Picker>
      </View>
    );
  }

  //Cria seletor de ambiente nivel 1 dinamicamente
  criarSeletorAmbienteFilho1() {
    return (
      <View hide="true">
        <Picker
          mode="dropdown"
          style={{ width: "90%", marginLeft: 10, color: "#0aa8af" }}
          selectedValue={this.state.seletorAmbiente1ID}
          onValueChange={(itemValue, _itemIndex) => {
            this.setState({ seletorAmbiente1ID: itemValue });
            this.verificaAmbientesNivel2PorAmbiente(itemValue);
            this.ativarAmbienteParaVistoria(itemValue, 1);
          }}
        >
          <Picker.Item label={defaultPlaceholder} value={defaultPlaceholder} />
          {this.renderizarAmbientes1()}
        </Picker>
      </View>
    );
  }

  //Cria seletor de ambiente nivel 1 dinamicamente
  criarSeletorAmbienteFilho2() {
    return (
      <View hide="true">
        <Picker
          mode="dropdown"
          style={{ width: "90%", marginLeft: 10, color: "#0aa8af" }}
          selectedValue={this.state.seletorAmbiente2ID}
          onValueChange={(itemValue, _itemIndex) => {
            this.setState({ seletorAmbiente2ID: itemValue });
            this.verificaAmbientesNivel3PorAmbiente(itemValue);
            this.ativarAmbienteParaVistoria(itemValue, 2);
          }}
        >
          <Picker.Item label={defaultPlaceholder} value={defaultPlaceholder} />
          {this.renderizarAmbientes2()}
        </Picker>
      </View>
    );
  }

  //Cria seletor de ambiente nivel 1 dinamicamente
  criarSeletorAmbienteFilho3() {
    return (
      <View hide="true">
        <Picker
          mode="dropdown"
          style={{ width: "90%", marginLeft: 10, color: "#0aa8af" }}
          selectedValue={this.state.seletorAmbiente3ID}
          onValueChange={(itemValue, _itemIndex) => {
            this.setState({ seletorAmbiente3ID: itemValue });
            this.ativarAmbienteParaVistoria(itemValue, 3);
          }}
        >
          <Picker.Item label={defaultPlaceholder} value={defaultPlaceholder} />
          {this.renderizarAmbientes3()}
        </Picker>
      </View>
    );
  }

  //Atualiza lista de ambientes de acordo com a localidade selecionada
  verificaAmbientesPorLocalidade(cod_localidade) {
    if (
      cod_localidade == 0 ||
      cod_localidade == "" ||
      cod_localidade == undefined ||
      cod_localidade == null
    )
      this.setState({ ambientes: this.state.listaVazia });

    this.state.localidades.forEach((localidade) => {
      if (localidade.cod_localidade == cod_localidade) {
        this.setState({ ambientes: localidade.lstAmbiente });
      }
    });
  }

  //Atualiza lista de ambientes filho de acordo com o ambiente selecionado
  verificaAmbientesFilhoPorAmbiente(cod_ambiente_pai) {
    if (
      cod_ambiente_pai == 0 ||
      cod_ambiente_pai == "" ||
      cod_ambiente_pai == undefined ||
      cod_ambiente_pai == null
    )
      this.setState({ ambientesFilho1: this.state.listaVazia });

    this.state.ambientes.forEach((ambiente) => {
      if (ambiente.cod_ambiente == cod_ambiente_pai) {
        if (ambiente.lstAmbientesFilho != null) {
          this.setState({ ambientesFilho1: ambiente.lstAmbientesFilho });
        }
      }
    });
  }

  //Atualiza lista de ambientes filho de acordo com o ambiente selecionado
  verificaAmbientesNivel2PorAmbiente(cod_ambiente_pai) {
    if (
      cod_ambiente_pai == 0 ||
      cod_ambiente_pai == "" ||
      cod_ambiente_pai == undefined ||
      cod_ambiente_pai == null
    )
      this.setState({ ambientesFilho2: this.state.listaVazia });

    this.state.ambientesFilho1.forEach((ambiente) => {
      if (ambiente.cod_ambiente == cod_ambiente_pai) {
        if (ambiente.lstAmbientesFilho != null) {
          this.setState({ ambientesFilho2: ambiente.lstAmbientesFilho });
        }
      }
    });
  }

  //Atualiza lista de ambientes filho de acordo com o ambiente selecionado
  verificaAmbientesNivel3PorAmbiente(cod_ambiente_pai) {
    if (
      cod_ambiente_pai == 0 ||
      cod_ambiente_pai == "" ||
      cod_ambiente_pai == undefined ||
      cod_ambiente_pai == null
    )
      this.setState({ ambientesFilho3: this.state.listaVazia });

    this.state.ambientesFilho2.forEach((ambiente) => {
      if (ambiente.cod_ambiente == cod_ambiente_pai) {
        if (ambiente.lstAmbientesFilho != null) {
          this.setState({ ambientesFilho3: ambiente.lstAmbientesFilho });
        }
      }
    });
  }

  //Atualiza lista de ambientes filho de acordo com o ambiente selecionado
  verificaAmbientesNivel4PorAmbiente(cod_ambiente_pai) {
    if (
      cod_ambiente_pai == 0 ||
      cod_ambiente_pai == "" ||
      cod_ambiente_pai == undefined ||
      cod_ambiente_pai == null
    )
      this.setState({ ambientesFilho4: this.state.listaVazia });

    this.state.ambientesFilho3.forEach((ambiente) => {
      if (ambiente.cod_ambiente == cod_ambiente_pai) {
        if (ambiente.lstAmbientesFilho != null) {
          this.setState({ ambientesFilho4: ambiente.lstAmbientesFilho });
        }
      }
    });
  }

  ativarAmbienteParaVistoria(cod_ambiente_selecionado, nivel) {
    if (cod_ambiente_selecionado == "") {
      this.setState({ ambienteParaVistoria: null });
      this.setState({ nomeAmbienteVistoria: "VISTORIAR " });
      return;
    }

    switch (nivel) {
      case 0:
        this.state.ambientes.forEach((ambiente) => {
          if (ambiente.cod_ambiente == cod_ambiente_selecionado) {
            if (
              ambiente.lstTipoItemVistoria != null &&
              ambiente.lstTipoItemVistoria != undefined &&
              ambiente.lstTipoItemVistoria.length > 0
            ) {
              this.setState({ ambienteParaVistoria: ambiente });
              this.setState({ nomeAmbienteVistoria: ambiente.dsc_ambiente });
            } else {
              this.setState({ ambienteParaVistoria: null });
              this.setState({ nomeAmbienteVistoria: "VISTORIAR " });
            }
          }
        });
        break;
      case 1:
        this.state.ambientesFilho1.forEach((ambiente) => {
          if (ambiente.cod_ambiente == cod_ambiente_selecionado) {
            if (
              ambiente.lstTipoItemVistoria != null &&
              ambiente.lstTipoItemVistoria != undefined &&
              ambiente.lstTipoItemVistoria.length > 0
            ) {
              this.setState({ ambienteParaVistoria: ambiente });
              this.setState({ nomeAmbienteVistoria: ambiente.dsc_ambiente });
            } else {
              this.setState({ ambienteParaVistoria: null });
              this.setState({ nomeAmbienteVistoria: "VISTORIAR " });
            }
          }
        });
        break;
      case 2:
        this.state.ambientesFilho2.forEach((ambiente) => {
          if (ambiente.cod_ambiente == cod_ambiente_selecionado) {
            if (
              ambiente.lstTipoItemVistoria != null &&
              ambiente.lstTipoItemVistoria != undefined &&
              ambiente.lstTipoItemVistoria.length > 0
            ) {
              this.setState({ ambienteParaVistoria: ambiente });
              this.setState({ nomeAmbienteVistoria: ambiente.dsc_ambiente });
            } else {
              this.setState({ ambienteParaVistoria: null });
              this.setState({ nomeAmbienteVistoria: "VISTORIAR " });
            }
          }
        });
        break;
      case 3:
        this.state.ambientesFilho3.forEach((ambiente) => {
          if (ambiente.cod_ambiente == cod_ambiente_selecionado) {
            if (
              ambiente.lstTipoItemVistoria != null &&
              ambiente.lstTipoItemVistoria != undefined &&
              ambiente.lstTipoItemVistoria.length > 0
            ) {
              this.setState({ ambienteParaVistoria: ambiente });
              this.setState({ nomeAmbienteVistoria: ambiente.dsc_ambiente });
            } else {
              this.setState({ ambienteParaVistoria: null });
              this.setState({ nomeAmbienteVistoria: "VISTORIAR " });
            }
          }
        });
        break;
      case 4:
        this.state.ambientesFilho3.forEach((ambiente) => {
          if (ambiente.cod_ambiente == cod_ambiente_selecionado) {
            if (
              ambiente.lstTipoItemVistoria != null &&
              ambiente.lstTipoItemVistoria != undefined &&
              ambiente.lstTipoItemVistoria.length > 0
            ) {
              this.setState({ ambienteParaVistoria: ambiente });
              this.setState({ nomeAmbienteVistoria: ambiente.dsc_ambiente });
            } else {
              this.setState({ ambienteParaVistoria: null });
              this.setState({ nomeAmbienteVistoria: "VISTORIAR " });
            }
          }
        });
        break;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  containerListas: {
    flex: 1,
    backgroundColor: "white",
  },
  scrow: {
    backgroundColor: "white",
    color: "#0aa8af",
    alignSelf: "stretch",
  },
  input: {
    width: 350,
    height: 50,
    backgroundColor: "#CCC",
    fontSize: 22,
    padding: 5,
    margin: 5,
  },
  list: {
    margin: 5,
    backgroundColor: "#1b3056",
    height: 80,
    width: 320,
    justifyContent: "space-around",
    paddingLeft: 10,
    paddingRight: 60,
    elevation: 1,
  },
  flatList: {
    marginBottom: 150,
  },
  listaImagens: {
    margin: 5,
    backgroundColor: "#1b3056",
    height: 460,
    width: 320,
    justifyContent: "center",
    paddingLeft: 10,
    paddingRight: 10,
    elevation: 1,
  },
  delete: {
    position: "absolute",
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    right: 0,
    bottom: 20,
    backgroundColor: "#1b3056",
    borderRadius: 30,
    elevation: 0,
  },
  deleteIcon: {
    fontSize: 30,
    color: "#1b3056",
  },
  edit: {
    position: "absolute",
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    left: 2,
    bottom: 20,
    backgroundColor: "#1b3056",
    borderRadius: 30,
    elevation: 0,
  },
  editIcon: {
    fontSize: 25,
    color: "#0aa8af",
  },
  containerCapture: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "black",
  },
  preview: {
    //flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  capture: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: -160,
    bottom: 75,
    backgroundColor: "#0aa8af",
    borderRadius: 30,
    elevation: 8,
  },
  captureIcon: {
    fontSize: 25,
    color: "white",
  },
  scannerIcon: {
    color: "white",
    width: 38,
    height: 38,
  },
  scannerOverlay: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: -160,
    bottom: 10,
    backgroundColor: "#0aa8af",
    borderRadius: 30,
    elevation: 20,
  },
  inspect: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: -160,
    bottom: 140,
    backgroundColor: "#0aa8af",
    borderRadius: 30,
    elevation: 8,
  },
  inspectIcon: {
    fontSize: 25,
    color: "white",
  },
  save: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: -160,
    bottom: 157,
    backgroundColor: "#0aa8af",
    borderRadius: 30,
    elevation: 8,
  },
  saveIcon: {
    fontSize: 25,
    color: "white",
  },
  input: {
    width: 350,
    height: 50,
    backgroundColor: "#CCC",
    fontSize: 22,
    padding: 5,
    margin: 5,
  },
});
