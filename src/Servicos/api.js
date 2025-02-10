import { create } from 'apisauce';

const api = create({
    //baseURL: 'https://vistoriasans.hml.infraero.gov.br/Login' // local
    //baseURL: 'http://10.0.99.70:3000'// local    
    baseURL: 'http://vistoriasans.infraero.gov.br/vistorias' // produção
})

api.addResponseTransform(response =>{
    if(!response.ok) throw response;
});

export default api;