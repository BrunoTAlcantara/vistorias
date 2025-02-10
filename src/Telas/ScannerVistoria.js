import React, { Component } from "react";
import { StyleSheet, View, Image, Alert } from "react-native";
import { RNCamera } from "react-native-camera";

var SQLite = require("react-native-sqlite-storage");
var db = SQLite.openDatabase({
  name: "vistoria.db",
  createFromLocation: "~vistoria.db",
});

export default class ScannerVistoria extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ambienteParaVistoria: null,
      codVistoria: null,
      codItemVistoriado: false,
      atualizaVistoria: null,
      atualizarCode: null,
    };

    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  handleBackButtonClick() {
    this.props.navigation.goBack(null);
    return true;
  }

  handleBarCodeRead = (barcode) => {
    if (typeof this.props.navigation.state.params.atualizarCode === "function") {
      this.props.navigation.state.params.atualizarCode(barcode.data); 
    }
    this.props.navigation.goBack();
};

  componentWillReceiveProps(nextProps) {
    this.setState({
      ambienteParaVistoria:
        nextProps.navigation.state.params.ambienteParaVistoria,
    });
    this.setState({
      codVistoria: nextProps.navigation.state.params.codVistoria,
    });
    this.setState({
      codItemVistoriado: nextProps.navigation.state.params.codItemVistoriado,
    });
    this.setState({
      atualizaVistoria: nextProps.navigation.state.params.atualizaVistoria,
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <RNCamera
          ref={(camera) => {
            this.camera = camera;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          autoFocus={RNCamera.Constants.AutoFocus.on}
          flashMode={RNCamera.Constants.FlashMode.off}
          permissionDialogTitle={"Permissão para usar a câmera"}
          permissionDialogMessage={
            "Precisamos da sua permissão para usar a câmera do seu celular"
          }
          onBarCodeRead={this.handleBarCodeRead}
        >
          <View style={styles.scannerOverlay}>
            <Image
              source={require("../img/icons-border.png")}
              style={styles.scannerIcon}
            />
          </View>
        </RNCamera>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "black",
  },
  preview: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  scannerOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -125 }, { translateY: -125 }],
    alignItems: "center",
    justifyContent: "center",
  },
  scannerIcon: {
    width: 250,
    height: 250,
    resizeMode: "contain",
  },
});
