import React, {Component} from 'react';

//class VistoriaServico {

    /**
     * Retorna configurações do aplicativo
     * @param {string} login identificação única do usuário     
     */
    ///*
    /*
    recuperaParametrosVistoria(login) {

        alert("antes do get teste") 

        fetch('http://localhost:24431/ServicosAplicativo/RecuperarParametrosDeVistoria/1')
        .then((r) => r.json()) 
        .then((json) => {
            alert("resposta: ")
            alert("resposta: " + JSON.stringify(json))  
            return json;
        });        
       
    }
}

export default new VistoriaServico()

*/


class VistoriaServico extends Component {
    recuperaParametrosVistoria(login) {

        alert('antes do get teste') 

        fetch('http://10.0.99.70:3000/ServicosAplicativo/RecuperarParametrosDeVistoria/1')
        .then((r) => r.json()) 
        .then((json) => {
            alert("resposta: ")
            alert("resposta: " + JSON.stringify(json))  
            return json;
        });        
       
    }
    
}

export default VistoriaServico