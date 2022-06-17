const { response } = require('express');
const res = require('express/lib/response');
const Pessoa = require('../models/pessoa');
const redis = require('redis');

const Client = redis.createClient({
    url: 'redis://localhost:6379'
});

const getPessoas = async (request, response)=>{
    const pessoas = await Pessoa.findAll();
    response.status(200).send(pessoas);
};

const addPessoa = async (request, response) =>{
    const pessoa = Pessoa.build(request.body);
    pessoa.save().then(()=>{
        response.status(200).send('Usuário criado!');
    }).catch(err =>{
        response.status(400).send('Falha ao salvar');
    });

};

const deletarPessoa = async (request, response)=>{
    const email = request.params.email;

    Pessoa.destroy({
        where: {
            email: email
        }
    }).then(result=>{
        if(result>0){
            response.status(200).send('Usuário removido');
        }else{
            response.status(200).send('Usuário não encontrado');
        }
    }).catch(err=>{
        response.status(400).send('Falha ao remover');
    });

};

const atualizarPessoa = async(request, response)=>{
    
    Pessoa.update({
        nome: request.body.nome},
            {
                where: {
                    email: request.body.email
            }
        }
    ).then(result=>{
        if(result>0){
            response.status(200).send('Usuário atualizado');
        }else{
            response.status(200).send('Usuário não encontrado');
        }
    }).catch(err=>{
        console.log(err);
        response.status(400).send('Falha ao atualizar');
    });

}

const getPessoasEmail=async(request, response) =>{
    await Client.connect();
    const email = request.params.email;

    const getPessoa = await Client.get(email);

    if (getPessoa!=null) {
        await Client.disconnect();
        response.status(200).send(JSON.parse(getPessoa));
    }else{
        try {
            const pessoa = await Pessoa.findOne({
                where:{
                    email: email
                },
            });

            const getSet = await Client.set(email, JSON.stringify(pessoa),{
                EX:3600
            });

            await Client.disconnect();

           response.status(200).send(pessoa);
        } catch (error) {
            response.status(200).send('Usuário não encontrado');
        }
    }
}


const sincronizar = async(request, response) =>{
    await Pessoa.sync();
    response.status(200).send('Sincronizado');
}

module.exports = {getPessoas, addPessoa, sincronizar, deletarPessoa, atualizarPessoa,getPessoasEmail};