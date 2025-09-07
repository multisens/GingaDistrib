const express = require('express');
const router = express.Router();
const service = require('./service');

router.get('/', async (req, res, next) => {
    res.render('main', {
        content: await service.content(req.app.get('views'), req.query.prev),
        current: 'profile',
        script: service.script(req.query.prev)
    });
});

// Rota para exibir página de criação de perfil
router.get('/create', async (req, res) => {
    try {
        // Teste simples primeiro
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Debug - Criar Perfil</title>
            <style>
                body { background: #111; color: white; font-family: Verdana; padding: 20px; }
                .debug { background: #333; padding: 10px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>Debug - Página de Criação de Perfil</h1>
            <div class="debug">
                <p><strong>Status:</strong> Rota funcionando ✓</p>
                <p><strong>Views Path:</strong> ${req.app.get('views')}</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <h2>Formulário de Teste</h2>
            <form style="background: #222; padding: 20px;">
                <div style="margin: 10px 0;">
                    <label>Nome:</label><br>
                    <input type="text" style="background: #333; color: white; border: 1px solid #666; padding: 8px; width: 200px;">
                </div>
                <div style="margin: 10px 0;">
                    <label>Idade:</label><br>
                    <input type="number" style="background: #333; color: white; border: 1px solid #666; padding: 8px; width: 200px;">
                </div>
                <div style="margin: 10px 0;">
                    <button type="button" style="background: #666; color: white; padding: 10px 20px; border: none; margin-right: 10px;">Cancelar</button>
                    <button type="button" style="background: #007bff; color: white; padding: 10px 20px; border: none;">Criar</button>
                </div>
            </form>
            
            <div class="debug">
                <h3>Links de Teste:</h3>
                <a href="/profile/test" style="color: #4af; margin-right: 10px;">Teste Básico</a>
                <a href="/profile/create-simple" style="color: #4af; margin-right: 10px;">Formulário Simples</a>
                <a href="/profile" style="color: #4af;">Voltar para Perfis</a>
            </div>
        </body>
        </html>
        `);
    } catch (error) {
        console.error('Error rendering create profile page:', error);
        res.status(500).send('Erro ao carregar página de criação de perfil: ' + error.message);
    }
});

// Rota de teste para criação simples
router.get('/create-test', async (req, res) => {
    try {
        const content = await require('ejs').renderFile(req.app.get('views') + '/create-profile-simple.ejs');
        res.send(content);
    } catch (error) {
        console.error('Error rendering test page:', error);
        res.status(500).send('Erro: ' + error.message);
    }
});

// Rota para criar novo usuário
router.post('/create', async (req, res) => {
    try {
        const newUser = service.addNewUser(req.body);
        res.json({ success: true, user: newUser });
    } catch (error) {
        console.error('Error creating new user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota para obter dados dos usuários
router.get('/users', (req, res) => {
    res.json({ users: service.DATA.users });
});

// Rota de teste básico
router.get('/test', (req, res) => {
    res.send('<html><body style="background:white;color:black;padding:20px;"><h1>TESTE FUNCIONANDO!</h1><p>O servidor está rodando corretamente.</p><a href="/profile/create-simple">Ir para formulário simples</a></body></html>');
});

// Rota simples para formulário
router.get('/create-simple', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Criar Perfil - Simples</title>
        <style>
            body { background: #222; color: white; font-family: Arial; padding: 20px; }
            input, select { background: #333; color: white; border: 1px solid #666; padding: 8px; margin: 5px 0; width: 200px; }
            button { background: #007bff; color: white; border: none; padding: 10px 20px; margin: 5px; cursor: pointer; }
            .cancel { background: #666; }
        </style>
    </head>
    <body>
        <h2>Criar Novo Perfil</h2>
        <form id="form">
            <div><label>Nome:</label><br><input type="text" id="name" required></div>
            <div><label>Idade:</label><br><input type="number" id="age"></div>
            <div><label>Gênero:</label><br>
                <select id="gender">
                    <option value="">Selecione...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                </select>
            </div>
            <br>
            <button type="button" class="cancel" onclick="history.back()">Voltar</button>
            <button type="submit">Criar</button>
        </form>
        
        <script>
            document.getElementById('form').onsubmit = function(e) {
                e.preventDefault();
                const name = document.getElementById('name').value;
                if (!name) { alert('Nome obrigatório!'); return; }
                
                fetch('/profile/create', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        name: name,
                        age: parseInt(document.getElementById('age').value) || null,
                        gender: document.getElementById('gender').value,
                        avatar: '0.png'
                    })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        alert('Perfil criado!');
                        window.location.href = '/profile';
                    } else {
                        alert('Erro: ' + data.error);
                    }
                })
                .catch(err => alert('Erro: ' + err));
            };
        </script>
    </body>
    </html>
    `);
});

// Rota para testar EJS original
router.get('/create-ejs', async (req, res) => {
    try {
        console.log('Tentando renderizar EJS...');
        console.log('Views path:', req.app.get('views'));
        
        const content = await require('ejs').renderFile(req.app.get('views') + '/create-profile.ejs');
        console.log('EJS renderizado com sucesso, length:', content.length);
        res.send(content);
    } catch (error) {
        console.error('Erro no EJS:', error);
        res.status(500).send(`
        <html><body style="background:#222;color:white;padding:20px;">
        <h1>Erro no EJS</h1>
        <pre>${error.message}</pre>
        <pre>${error.stack}</pre>
        </body></html>
        `);
    }
});

module.exports = router;