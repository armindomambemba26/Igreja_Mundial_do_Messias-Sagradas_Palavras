IGREJA MUNDIAL DO MESSIAS — SAGRADAS PALAVRAS
VERSÃO FIREBASE + GOOGLE DRIVE (SEM FIREBASE STORAGE)

O sistema usa:
- GitHub Pages para o site;
- Firebase Authentication + Firestore para contas, dados, categorias, materiais e feedbacks;
- Google Drive para guardar automaticamente PDFs e documentos Word.

CONFIGURAÇÃO DO FIREBASE
1. No Firebase Authentication, ative Email/Password.
2. Crie o utilizador administrador.
3. Copie o UID.
4. No Firestore, crie admins/{UID} com active=true.
5. Publique firestore.rules.
6. firebase-config.js já contém a configuração fornecida pelo proprietário.

CONFIGURAÇÃO DO GOOGLE DRIVE
1. Crie uma pasta no seu Google Drive para guardar as Sagradas Palavras.
2. Abra script.google.com e crie um novo projeto.
3. Abra GoogleAppsScript.gs deste pacote e cole o conteúdo no projeto.
4. Substitua DRIVE_FOLDER_ID pelo ID da pasta do Drive.
5. Substitua API_TOKEN por uma chave longa criada por si.
6. Publique o projeto como Web App:
   - Executar como: você
   - Quem tem acesso: Qualquer pessoa
7. Autorize o acesso ao Google Drive quando o Google pedir.
8. Copie o URL do Web App.
9. Abra drive-config.js e substitua:
   DRIVE_UPLOAD_URL = 'COLE_AQUI_O_URL_DO_WEB_APP'
   DRIVE_UPLOAD_TOKEN = 'COLE_AQUI_UMA_CHAVE_SECRETA_LONGA'
   usando exatamente a mesma chave do Apps Script.
10. Faça o upload dos ficheiros atualizados para o GitHub Pages.

COMO FUNCIONA
- O administrador entra no painel.
- Seleciona PDF e/ou Word.
- Clica em Publicar material.
- O navegador envia o ficheiro para o Web App do Google Apps Script.
- O Apps Script cria o ficheiro na pasta do Google Drive e torna-o acessível por link.
- O Firestore guarda o link e o ID do ficheiro.
- Ao substituir um ficheiro durante a edição, o ficheiro antigo é colocado no lixo do Drive.
- Ao eliminar um material, os ficheiros correspondentes também são colocados no lixo do Drive.

LIMITAÇÕES IMPORTANTES
- O Google Drive/Apps Script é usado dentro das quotas gratuitas da conta Google; quotas e políticas podem mudar.
- O sistema limita cada PDF/Word a 15 MB para evitar pedidos muito pesados.
- O token usado no frontend fica visível no código publicado. Para um nível de segurança mais elevado, a próxima evolução deve autenticar a chamada do Apps Script com o utilizador Firebase, em vez de usar uma chave exposta no frontend.

PUBLICAÇÃO
GitHub Pages pode continuar a hospedar este frontend normalmente. Não é necessário ativar Firebase Storage.
