import React, {useEffect, useState, ChangeEvent, FormEvent} from 'react';
import { Map, TileLayer, Marker } from 'react-leaflet';
import {LeafletMouseEvent} from 'leaflet';
import {Link, useHistory} from 'react-router-dom';
import {FiArrowLeft} from 'react-icons/fi';
import axios from 'axios';
import Dropzone from '../../components/Dropzone';
import api from '../../services/api';
import logo from '../../assets/logo.svg';
import './styles.css';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUFResponse {
    sigla: string;
}

interface IBGECityResponse {
    nome: string;
}

const CreatePoint = () => {
    //lista de items
    const [items, setItems] = useState<Item[]>([]);
    //lista de ufs
    const [ufs, setUfs] = useState<string[]>([]);
    //lista de citys
    const [citys, setCitys] = useState<string[]>([]);
    //pega a posição inicial do usuário para exibir sua localização no mapa
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0]);
    //pega a posição selecionada pelo usuário
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);
    //pega o estado que foi selecionado pelo usuário
    const [selectedUf, setSelectedUf] = useState('0');
    //pega os itens selecionados pelo usuário
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    //pega o cidade selecionada pelo usuario
    const [selectedCity, setSelectedCity] = useState('0');
    //pega os dados do formulário dos campos name, email e whatsapp
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    });

    const [selectedFile, setSelectedFile] = useState<File>();
    

    const history = useHistory();
    //pega a localização do usuário quando a página é carregada
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const {latitude, longitude} = position.coords;
            setInitialPosition([latitude, longitude]);
        });
    }, []);

    //executa quando a página é carregada listando os items
    useEffect(() => {
        api.get('items').then(response =>{
            setItems(response.data);            
        })
    }, []);

    //lista todos os estados quando a página for carregada
    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response =>{
            const ufInitials = response.data.map(uf => uf.sigla);
            setUfs(ufInitials);
        })
    }, []);

    //lista todas as cidades de um estado assim que o estado for selecionado
    useEffect(() => {
        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response =>{
            const cityNames = response.data.map(city => city.nome);
            setCitys(cityNames);
        })
    }, [selectedUf]);


    //pega o valor selecionado no campo select do estado
    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;
        setSelectedUf(uf);
    }

    //pega o valor selecionado no campo select do cidade
    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;
        setSelectedCity(city);
    }

    //pega a latitude e longitude do ponto selecionado pelo usuário no mapa
    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ])
    }

    //pega as informações do formulário e armazena no formData
    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const {name, value} = event.target;
        setFormData({...formData, [name]: value});
    }

    //pega o id do item selecionado e verifica se o item já existe no array e o add caso ainda não exista
    function handleSelectItem(id: number){
        const alreadySelected = selectedItems.findIndex(item => item === id);
        if(alreadySelected > -1){
            const filteredItem = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItem);
        }else {
            setSelectedItems([...selectedItems, id]);
        }
        
    }

    //pega os dados do formulário e grava no banco de dados
    async function handleSubmit(event: FormEvent){
        event.preventDefault();
        const {name, email, whatsapp} = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;
        
        const data = new FormData();
        
            data.append('name', name);
            data.append('email', email);
            data.append('whatsapp', whatsapp);
            data.append('uf', uf);
            data.append('city', city);
            data.append('latitude', String(latitude));
            data.append('longitude', String(longitude));
            data.append('items', items.join(','));
            
            if(selectedFile){
                data.append('image', selectedFile);
            }
        await api.post('points', data);
        
        alert('Ponto de coleta cadastrado');

        history.push('/');
    }

    return (
    <div id="page-create-point">
        <header>
            <img src={logo} alt="Ecoleta"/>
            <Link to="/">
                <FiArrowLeft/>
                Voltar para Home
            </Link>
        </header>
        <main>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/>Ponto de coleta</h1>
                
                <Dropzone onFileUploaded={setSelectedFile}/>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                        <div className="field">
                            <label htmlFor="name">Nome da entidade</label>
                            <input type="text" name="name" id="name" onChange={handleInputChange}/>
                        </div>
                        <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" name="email" id="email" onChange={handleInputChange}/>
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange}/>
                        </div>
                        </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>
                        <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                            <TileLayer
                                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={selectedPosition}/>
                        </Map>
                        <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado</label>
                            <select name="uf" id="uf" value={selectedUf} onChange={handleSelectUf}>
                                <option value="0">
                                    Selecione um estado
                                </option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                            </div>
                            <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                                <option value="0">
                                    Selecione uma cidade
                                </option>
                                {citys.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            </div>
                        </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Itens de coletas</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>
                        <ul className="items-grid">
                            {items.map(item => (
                                <li 
                                key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected': ''}
                                >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                            ))}
                        </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </main>
    </div>
    );
};



export default CreatePoint;